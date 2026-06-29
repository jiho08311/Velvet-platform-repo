import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { readCreatorIdentityByCreatorId } from "@/modules/identity/public/creator-identity-read-model"

import type {
  ListCreatorPostsCreatorRow,
  MyPostsCreatorRow,
  PostCreateCreatorRow,
  PostCreatorProfileVisibilityRow,
  PostCreatorRow,
  PostCreatorStatus,
  PostMediaCreatorRow,
} from "./post-repository-types"

function toActiveCreatorStatus(
  status: string | null | undefined,
): PostCreatorStatus {
  if (status === "active" || status === "pending" || status === "suspended") {
    return status
  }

  return "inactive"
}

function normalizeProfileVisibilityRow(input: {
  profileId: string
  profileLifecycleState?: string | null
  identityVisibilityState?: string | null
}): PostCreatorProfileVisibilityRow {
  return {
    id: input.profileId,
    profile_lifecycle_state: input.profileLifecycleState ?? "active",
    identity_visibility_state: input.identityVisibilityState ?? "visible",
    is_deactivated: false,
    is_delete_pending: false,
    deleted_at: null,
    is_banned: false,
  }
}

async function readCanonicalCreatorProfile(input: {
  profileId: string
  fallbackUserId: string
}): Promise<PostCreatorProfileVisibilityRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id, profile_lifecycle_state, identity_visibility_state")
    .eq("profile_id", input.profileId)
    .maybeSingle<{
      profile_id: string | null
      profile_lifecycle_state: string | null
      identity_visibility_state: string | null
    }>()

  if (error) {
    throw error
  }

  return normalizeProfileVisibilityRow({
    profileId: data?.profile_id ?? input.profileId ?? input.fallbackUserId,
    profileLifecycleState: data?.profile_lifecycle_state,
    identityVisibilityState: data?.identity_visibility_state,
  })
}

async function readCanonicalCreatorRow(
  creatorId: string,
): Promise<PostCreatorRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_creators")
    .select(
      "creator_id, user_id, profile_id, username, display_name, status, creator_lifecycle_state, creator_visibility_state",
    )
    .eq("creator_id", creatorId)
    .maybeSingle<{
      creator_id: string | null
      user_id: string | null
      profile_id: string | null
      username: string | null
      display_name: string | null
      status: string | null
      creator_lifecycle_state: string | null
      creator_visibility_state: string | null
    }>()

  if (error) {
    throw error
  }

  if (!data?.creator_id || !data.user_id) {
    return null
  }

  const profile = await readCanonicalCreatorProfile({
    profileId: data.profile_id ?? data.user_id,
    fallbackUserId: data.user_id,
  })

  return {
    id: data.creator_id,
    user_id: data.user_id,
    username: data.username ?? "",
    display_name: data.display_name,
    status: toActiveCreatorStatus(data.creator_lifecycle_state ?? data.status),
    creator_visibility_state: data.creator_visibility_state,
    profiles: profile,
  }
}

export async function findCreatorForPostMediaAccess(
  creatorId: string,
): Promise<PostMediaCreatorRow | null> {
  const creator = await readCanonicalCreatorRow(creatorId)

  return creator
    ? {
        id: creator.id,
        user_id: creator.user_id,
        status: creator.status,
        creator_visibility_state: creator.creator_visibility_state,
        profiles: creator.profiles,
      }
    : null
}

export async function findCreatorForMyPosts(
  rawCreatorId: string,
): Promise<MyPostsCreatorRow | null> {
  const byCreatorId = await readCreatorIdentityByCreatorId(rawCreatorId)

  if (byCreatorId) {
    return {
      id: byCreatorId.id,
      user_id: byCreatorId.userId,
    }
  }

  const { data, error } = await supabaseAdmin
    .from("canonical_creators")
    .select("creator_id, user_id")
    .eq("user_id", rawCreatorId)
    .maybeSingle<{
      creator_id: string | null
      user_id: string | null
    }>()

  if (error) {
    throw error
  }

  if (!data?.creator_id || !data.user_id) {
    return null
  }

  return {
    id: data.creator_id,
    user_id: data.user_id,
  }
}

export async function findCreatorForListCreatorPosts(
  creatorId: string,
): Promise<ListCreatorPostsCreatorRow | null> {
  const creator = await readCanonicalCreatorRow(creatorId)

  return creator
    ? {
        id: creator.id,
        user_id: creator.user_id,
        status: creator.status,
        creator_visibility_state: creator.creator_visibility_state,
        profiles: creator.profiles,
      }
    : null
}

export async function findCreatorForPostCreate(
  creatorId: string,
): Promise<PostCreateCreatorRow | null> {
  const creator = await readCreatorIdentityByCreatorId(creatorId)

  return creator ? { id: creator.id } : null
}

export async function findPostCreatorById(
  creatorId: string,
): Promise<PostCreatorRow | null> {
  return readCanonicalCreatorRow(creatorId)
}