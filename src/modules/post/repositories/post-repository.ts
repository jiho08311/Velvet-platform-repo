import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
export {
  findCreatorForListCreatorPosts,
  findCreatorForMyPosts,
  findCreatorForPostCreate,
  findCreatorForPostMediaAccess,
  findPostCreatorById,
} from "./post-creator-read-repository"
import {
  toCreatorStudioPostDetailRow,
  toCreatorStudioPostRow,
  toListCreatorPostsPostRow,
  toMyPostsPostRow,
  toPostMediaAccessPostRow,
  toPostRow,
} from "./post-repository-mappers"
import type {
  CanonicalPostRow,
  CreatorStudioPostDetailRow,
  CreatorStudioPostRow,
  ListCreatorPostsCreatorRow,
  ListCreatorPostsPostRow,
  MyPostsCreatorRow,
  MyPostsPostRow,
  PostCreateCreatorRow,
  PostMediaAccessPostRow,
  PostMediaCreatorRow,
  PostRow,
} from "./post-repository-types"
export type {
  CreatorStudioPostDetailRow,
  CreatorStudioPostRow,
  CurrentPostStatus,
  ListCreatorPostsCreatorRow,
  ListCreatorPostsPostRow,
  MyPostsCreatorRow,
  MyPostsPostRow,
  PostCreateCreatorRow,
  PostCreatorRow,
  PostMediaAccessPostRow,
  PostMediaCreatorRow,
  PostRow,
} from "./post-repository-types"

async function findCanonicalPostById(
  postId: string,
): Promise<CanonicalPostRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_posts")
    .select(
      "post_id, creator_id, title, content, visibility, price, lifecycle_state, visibility_state, moderation_state, published_at, deleted_at, created_at, updated_at",
    )
    .eq("post_id", postId)
    .maybeSingle<CanonicalPostRow>()

  if (error) {
    throw error
  }

  return data
}

export async function findPostForMediaAccess(
  postId: string,
): Promise<PostMediaAccessPostRow | null> {
  const row = await findCanonicalPostById(postId)

  return row && row.deleted_at == null ? toPostMediaAccessPostRow(row) : null
}

export async function findPostRowsForCreatorPostList(params: {
  creatorId: string
  limit: number
  status?: "draft" | "published" | "archived"
}): Promise<ListCreatorPostsPostRow[]> {
  let query = supabaseAdmin
    .from("canonical_posts")
    .select(
      "post_id, creator_id, title, content, lifecycle_state, visibility, price, published_at, created_at, updated_at, visibility_state, moderation_state, deleted_at",
    )
    .eq("creator_id", params.creatorId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(params.limit)

  if (params.status) {
    query = query.eq("lifecycle_state", params.status)
  }

  const { data, error } = await query.returns<CanonicalPostRow[]>()

  if (error) {
    throw error
  }

  return (data ?? []).map(toListCreatorPostsPostRow)
}

export async function findMyPostRowsByCreatorId(params: {
  creatorId: string
  status?: "draft" | "scheduled" | "published"
  limit: number
}): Promise<MyPostsPostRow[]> {
  let query = supabaseAdmin
    .from("canonical_posts")
    .select(
      "post_id, creator_id, title, content, lifecycle_state, visibility, price, published_at, deleted_at, created_at, updated_at, visibility_state, moderation_state",
    )
    .eq("creator_id", params.creatorId)
    .is("deleted_at", null)

  if (params.status) {
    query = query.eq("lifecycle_state", params.status)
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(params.limit)
    .returns<CanonicalPostRow[]>()

  if (error) {
    throw error
  }

  return (data ?? []).map(toMyPostsPostRow)
}

export async function findCreatorStudioPostRowsByCreatorId(
  creatorId: string,
): Promise<CreatorStudioPostRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_posts")
    .select(
      "post_id, creator_id, title, content, lifecycle_state, visibility, price, published_at, deleted_at, created_at, updated_at, visibility_state, moderation_state",
    )
    .eq("creator_id", creatorId)
    .in("lifecycle_state", ["draft", "scheduled", "published", "archived"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<CanonicalPostRow[]>()

  if (error) {
    throw error
  }

  return (data ?? []).map(toCreatorStudioPostRow)
}

export async function findCreatorStudioPostById(params: {
  postId: string
  creatorId: string
}): Promise<CreatorStudioPostDetailRow | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_posts")
    .select(
      "post_id, creator_id, title, content, lifecycle_state, visibility, price, published_at, deleted_at, created_at, updated_at, visibility_state, moderation_state",
    )
    .eq("post_id", params.postId)
    .eq("creator_id", params.creatorId)
    .in("lifecycle_state", ["draft", "scheduled", "published", "archived"])
    .is("deleted_at", null)
    .maybeSingle<CanonicalPostRow>()

  if (error) {
    throw error
  }

  return data ? toCreatorStudioPostDetailRow(data) : null
}

export async function softDeletePostByCreator({
  postId,
  creatorId,
  deletedAt,
  updatedAt,
}: {
  postId: string
  creatorId: string
  deletedAt: string
  updatedAt: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_posts")
    .update({
      deleted_at: deletedAt,
      updated_at: updatedAt,
    })
    .eq("post_id", postId)
    .eq("creator_id", creatorId)
    .in("lifecycle_state", ["draft", "scheduled", "published", "archived"])
    .is("deleted_at", null)

  if (error) {
    throw error
  }
}

export async function findPostById(postId: string): Promise<PostRow | null> {
  const row = await findCanonicalPostById(postId)

  return row && row.deleted_at == null ? toPostRow(row) : null
}
