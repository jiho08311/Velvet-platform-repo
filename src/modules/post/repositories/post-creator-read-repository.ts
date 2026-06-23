import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { readCreatorIdentityByCreatorId } from "@/modules/identity/public/creator-identity-read-model"

import type {
  ListCreatorPostsCreatorRow,
  MyPostsCreatorRow,
  PostCreateCreatorRow,
  PostCreatorRow,
  PostMediaCreatorRow,
} from "./post-repository-types"

function toActiveCreatorStatus(
  status: string | null | undefined,
): "active" | "pending" | "suspended" | "inactive" {
  if (status === "active" || status === "pending" || status === "suspended") {
    return status
  }

  return "inactive"
}

async function readCanonicalCreatorRow(
  creatorId: string,
): Promise<PostCreatorRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_creators")
    .select("creator_id, user_id, username, display_name, status, creator_lifecycle_state")
    .eq("creator_id", creatorId)
    .maybeSingle<{
      creator_id: string | null
      user_id: string | null
      username: string | null
      display_name: string | null
      status: string | null
      creator_lifecycle_state: string | null
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
    username: data.username ?? "",
    display_name: data.display_name,
    status: toActiveCreatorStatus(data.creator_lifecycle_state ?? data.status),
    profiles: {
      id: data.user_id,
      is_deactivated: false,
      is_delete_pending: false,
      deleted_at: null,
      is_banned: false,
    },
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
