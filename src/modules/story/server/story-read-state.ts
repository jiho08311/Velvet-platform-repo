import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { checkSubscription } from "@/modules/subscription/server/check-subscription"
import { getStoryAccessState } from "../lib/get-story-access-state"
import { getStorySurfaceEligibility } from "../lib/get-story-surface-eligibility"
import { resolveStoryReadWriteEligibility } from "../lib/story-read-policy"
import type {
  StoryReadStateWriteParams,
  StoryReadStateWriteResult,
  StorySurfaceEligibilityInput,
} from "../types"

/**
 * Story Read-State Contract (SOURCE OF TRUTH)
 *
 * - Scope: creator-level (NOT per-story)
 * - Key: viewer_user_id + creator_id
 * - Value: last_seen_story_id
 *
 * Interpretation:
 * - last_seen_story_id === latest visible story → creator is fully read
 * - last_seen_story_id !== latest → creator has unread stories
 *
 * Important:
 * - This file ONLY handles persistence (read/write)
 * - UI interpretation MUST go through story-read-policy
 */

type StoryReadStateProfileRow =
  | {
      is_deactivated: boolean | null
      is_delete_pending: boolean | null
      deleted_at: string | null
      is_banned: boolean | null
    }
  | {
      is_deactivated: boolean | null
      is_delete_pending: boolean | null
      deleted_at: string | null
      is_banned: boolean | null
    }[]
  | null

type StoryReadStateCreatorRow =
  | {
      id: string
      user_id: string
      status: string | null
      profiles: StoryReadStateProfileRow
    }
  | {
      id: string
      user_id: string
      status: string | null
      profiles: StoryReadStateProfileRow
    }[]
  | null

type StoryReadTargetRow = {
  id: string
  creator_id: string
  visibility: "public" | "subscribers"
  expires_at: string
  is_deleted: boolean
  creators: StoryReadStateCreatorRow
}

function pickJoinedRow<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

async function getStoryReadTarget(params: {
  viewerUserId: string
  creatorId: string
  storyId: string
}): Promise<{
  eligibilityInput: StorySurfaceEligibilityInput | null
  story:
    | {
        id: string
        creatorId: string
        expiresAt: string
        isDeleted: boolean
        isLocked: boolean
      }
    | null
}> {
  const { data, error } = await supabaseAdmin
    .from("stories")
    .select(
      `
        id,
        creator_id,
        visibility,
        expires_at,
        is_deleted,
        creators (
          id,
          user_id,
          status,
          profiles (
            is_deactivated,
            is_delete_pending,
            deleted_at,
            is_banned
          )
        )
      `
    )
    .eq("id", params.storyId)
    .maybeSingle<StoryReadTargetRow>()

  if (error) throw error

  if (!data) {
    return {
      eligibilityInput: null,
      story: null,
    }
  }

  const creator = pickJoinedRow(data.creators)
  const profile = pickJoinedRow(creator?.profiles ?? null)
  const isOwner = !!creator?.user_id && creator.user_id === params.viewerUserId
  const hasSubscriptionAccess =
    data.visibility === "subscribers" && !isOwner && creator?.id
      ? await checkSubscription({
          userId: params.viewerUserId,
          creatorId: creator.id,
        })
      : false

  const accessState = getStoryAccessState({
    visibility: data.visibility,
    isOwner,
    hasSubscriptionAccess,
  })

  return {
    eligibilityInput: {
      now: new Date().toISOString(),
      story: {
        isDeleted: data.is_deleted,
        expiresAt: data.expires_at,
      },
      creator: creator
        ? {
            status: creator.status,
          }
        : null,
      profile: profile
        ? {
            isDeactivated: profile.is_deactivated,
            isDeletePending: profile.is_delete_pending,
            deletedAt: profile.deleted_at,
            isBanned: profile.is_banned,
          }
        : null,
    },
    story: {
      id: data.id,
      creatorId: data.creator_id,
      expiresAt: data.expires_at,
      isDeleted: data.is_deleted,
      isLocked: accessState !== "visible_unlocked",
    },
  }
}


export async function getStoryReadStateMap(viewerUserId: string) {
  const { data, error } = await supabaseAdmin
    .from("story_read_states")
    .select("creator_id, last_seen_story_id")
    .eq("viewer_user_id", viewerUserId)

  if (error) throw error

  const map = new Map<string, string>()

  for (const row of data ?? []) {
    if (row.last_seen_story_id) {
      map.set(row.creator_id, row.last_seen_story_id)
    }
  }

  return map
}

export async function markStoryReadState(
  params: StoryReadStateWriteParams
): Promise<StoryReadStateWriteResult> {
  const { viewerUserId, creatorId, lastSeenStoryId } = params
  const target = await getStoryReadTarget({
    viewerUserId,
    creatorId,
    storyId: lastSeenStoryId,
  })

  const surfaceEligibility =
    target.eligibilityInput &&
    getStorySurfaceEligibility(target.eligibilityInput) === "included"
      ? target.story
      : null

  const resolution = resolveStoryReadWriteEligibility({
    creatorId,
    storyId: lastSeenStoryId,
    story: surfaceEligibility,
  })

  if (!resolution.canPersist || !resolution.validLastSeenStoryId) {
    const reason =
      resolution.reason === "eligible" ? "story_missing" : resolution.reason

    return {
      ok: false,
      creatorId,
      reason,
    }
  }

  const { error } = await supabaseAdmin
    .from("story_read_states")
    .upsert(
      {
        viewer_user_id: viewerUserId,
        creator_id: creatorId,
        last_seen_story_id: resolution.validLastSeenStoryId,
        last_seen_at: new Date().toISOString(),
      },
      {
        onConflict: "viewer_user_id,creator_id",
      }
    )

  if (error) throw error

  return {
    ok: true,
    creatorId,
    persistedStoryId: resolution.validLastSeenStoryId,
  }
}
