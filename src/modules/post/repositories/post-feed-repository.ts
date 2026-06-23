import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { PostBlockEditorState } from "@/modules/post/types"

import { listPostMedia } from "@/modules/media/public/list-post-media"
import { readPostBlockAuthority } from "@/modules/post/repositories/post-block-read-authority-repository"
import type {
  CanonicalCreatorRow,
  CanonicalFeedItemRow,
  CanonicalProfileRow,
  CreatorFeedPostRow,
  FeedCreatorRow,
  FeedMediaRow,
  FeedPostBlockRow,
  SubscribedFeedPostRow,
} from "./post-feed-repository-types"

export type {
  CreatorFeedPostRow,
  FeedCreatorRow,
  FeedMediaRow,
  FeedPostBlockRow,
  SubscribedFeedPostRow,
} from "./post-feed-repository-types"

function normalizeCreatorStatus(
  state: string | null
): "active" | "pending" | "suspended" | "inactive" {
  if (state === "active") return "active"
  if (state === "pending") return "pending"
  if (state === "suspended") return "suspended"
  return "inactive"
}

function toCreatorFeedPostRow(row: CanonicalFeedItemRow): CreatorFeedPostRow {
  return {
    id: row.post_id,
    creator_id: row.creator_id,
    content: row.content,
    visibility: row.visibility,
    price: row.price,
    status: row.status,
    created_at: row.created_at,
    published_at: row.published_at,
    visibility_status: row.visibility_status,
    moderation_status: row.moderation_status,
    deleted_at: row.deleted_at,
    feed_visibility_state: row.feed_visibility_state,
    is_feed_visible: row.is_feed_visible,
  }
}

function toSubscribedFeedPostRow(row: CanonicalFeedItemRow): SubscribedFeedPostRow {
  return {
    id: row.post_id,
    creator_id: row.creator_id,
    title: row.title,
    content: row.content,
    status: row.status as SubscribedFeedPostRow["status"],
    visibility: row.visibility,
    price: row.price,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    visibility_status: row.visibility_status,
    moderation_status: row.moderation_status,
    deleted_at: row.deleted_at,
    feed_visibility_state: row.feed_visibility_state,
    is_feed_visible: row.is_feed_visible,
  }
}

export async function findCreatorFeedCreatorById(
  creatorId: string
): Promise<FeedCreatorRow | null> {
  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("canonical_creators")
    .select("creator_id, user_id, creator_lifecycle_state, creator_visibility_state")
    .eq("creator_id", creatorId)
    .maybeSingle<CanonicalCreatorRow>()

  if (creatorError) {
    throw creatorError
  }

  if (!creator) return null

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id, profile_lifecycle_state, identity_visibility_state")
    .eq("profile_id", creator.user_id)
    .maybeSingle<CanonicalProfileRow>()

  if (profileError) {
    throw profileError
  }

  return {
    id: creator.creator_id,
    user_id: creator.user_id,
    status: normalizeCreatorStatus(creator.creator_lifecycle_state),
    creatorVisibilityState: creator.creator_visibility_state,
profiles: profile
  ? {
      id: profile.profile_id,
      is_deactivated: profile.profile_lifecycle_state === "deactivated",
      is_delete_pending: profile.profile_lifecycle_state === "delete_pending",
      deleted_at: null,
      is_banned: profile.identity_visibility_state === "not_visible",
      profileLifecycleState: profile.profile_lifecycle_state,
      identityVisibilityState: profile.identity_visibility_state,
    }
  : null,
  }
}

export async function findCreatorFeedPostsByCreatorId(
  creatorId: string
): Promise<CreatorFeedPostRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_feed_items")
    .select(
      "post_id, creator_id, title, content, visibility, price, status, visibility_status, moderation_status, published_at, created_at, updated_at, deleted_at, feed_visibility_state, is_feed_visible"
    )
    .eq("creator_id", creatorId)
    .eq("is_feed_visible", true)
    .order("created_at", { ascending: false })
    .returns<CanonicalFeedItemRow[]>()

  if (error) {
    throw error
  }

  return (data ?? []).map(toCreatorFeedPostRow)
}

export async function findSubscribedFeedCreatorsByIds(
  creatorIds: string[]
): Promise<FeedCreatorRow[]> {
  if (creatorIds.length === 0) return []

  const { data: creators, error } = await supabaseAdmin
    .from("canonical_creators")
    .select("creator_id, user_id, creator_lifecycle_state, creator_visibility_state")
    .in("creator_id", creatorIds)
    .returns<CanonicalCreatorRow[]>()

  if (error) {
    throw error
  }

  const profileIds = (creators ?? []).map((creator) => creator.user_id)

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id, profile_lifecycle_state, identity_visibility_state")
    .in("profile_id", profileIds)
    .returns<CanonicalProfileRow[]>()

  if (profilesError) {
    throw profilesError
  }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.profile_id, profile]))

  return (creators ?? []).map((creator) => {
    const profile = profileById.get(creator.user_id)

    return {
      id: creator.creator_id,
      user_id: creator.user_id,
      status: normalizeCreatorStatus(creator.creator_lifecycle_state),
      creatorVisibilityState: creator.creator_visibility_state,
profiles: profile
  ? {
      id: profile.profile_id,
      is_deactivated: profile.profile_lifecycle_state === "deactivated",
      is_delete_pending: profile.profile_lifecycle_state === "delete_pending",
      deleted_at: null,
      is_banned: profile.identity_visibility_state === "not_visible",
      profileLifecycleState: profile.profile_lifecycle_state,
      identityVisibilityState: profile.identity_visibility_state,
    }
  : null,
    }
  })
}

export async function findSubscribedFeedPostsByCreatorIds(params: {
  creatorIds: string[]
  limit: number
}): Promise<SubscribedFeedPostRow[]> {
  if (params.creatorIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from("canonical_feed_items")
    .select(
      "post_id, creator_id, title, content, visibility, price, status, visibility_status, moderation_status, published_at, created_at, updated_at, deleted_at, feed_visibility_state, is_feed_visible"
    )
    .in("creator_id", params.creatorIds)
    .in("visibility", ["public", "subscribers"])
    .eq("is_feed_visible", true)
    .order("published_at", { ascending: false })
    .limit(params.limit)
    .returns<CanonicalFeedItemRow[]>()

  if (error) {
    throw error
  }

  return (data ?? []).map(toSubscribedFeedPostRow)
}

export async function findFeedPostBlocksByPostIds(
  postIds: string[]
): Promise<FeedPostBlockRow[]> {
  if (postIds.length === 0) return []

  const rows = await Promise.all(
    postIds.map(async (postId) => {
      const blocks = await readPostBlockAuthority(postId)

   return blocks.map((block) => ({
  id: block.id,
  post_id: block.post_id,
  type: block.type as FeedPostBlockRow["type"],
  content: block.content,
  media_id: block.media_id,
  sort_order: block.sort_order,
  created_at: block.created_at,
  editor_state: block.editor_state as PostBlockEditorState | null,
}))
    })
  )

  return rows.flat().sort((a, b) => {
    if (a.post_id === b.post_id) {
      return a.sort_order - b.sort_order
    }

    return a.post_id.localeCompare(b.post_id)
  })
}
export async function findFeedPostMediaRowsByPostIds(params: {
  postIds: string[]
  statuses: Array<"processing" | "ready" | "failed">
}): Promise<FeedMediaRow[]> {
  if (params.postIds.length === 0) return []

  const rows = await listPostMedia({
    postIds: params.postIds,
    requireReadyAsset: false,
  })

  const allowedStatuses = new Set(params.statuses)

  return rows
    .map((item): FeedMediaRow => {
      const status =
        item.media.processingStatus === "failed"
          ? "failed"
          : item.media.processingStatus === "ready"
            ? "ready"
            : "processing"

      return {
        id: item.media.id,
        post_id: item.postId,
        storage_path: item.media.storagePath,
        type: item.media.mediaType,
        mime_type: item.media.mimeType,
        status,
        sort_order: item.sortOrder,
      }
    })
    .filter((row) => allowedStatuses.has(row.status))
}
