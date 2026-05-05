import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type PostLikeRow = {
  post_id: string
  user_id: string
}

export async function countPostLikes(postId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)

  if (error) {
    throw error
  }

  return count ?? 0
}

export async function insertPostLike(params: {
  postId: string
  userId: string
}): Promise<void> {
  const { error } = await supabaseAdmin.from("post_likes").insert({
    post_id: params.postId,
    user_id: params.userId,
  })

  if (error) {
    throw error
  }
}

export async function deletePostLike(params: {
  postId: string
  userId: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("post_likes")
    .delete()
    .eq("post_id", params.postId)
    .eq("user_id", params.userId)

  if (error) {
    throw error
  }
}

export async function hasUserLikedPost(params: {
  postId: string
  userId: string
}): Promise<boolean> {
  const { count, error } = await supabaseAdmin
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", params.postId)
    .eq("user_id", params.userId)

  if (error) {
    throw error
  }

  return (count ?? 0) > 0
}

export async function findPostLikeRowsByPostIds(
  postIds: string[]
): Promise<PostLikeRow[]> {
  if (postIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from("post_likes")
    .select("post_id, user_id")
    .in("post_id", postIds)

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findUserPostLikeRowsByPostIds(params: {
  postIds: string[]
  userId: string
}): Promise<PostLikeRow[]> {
  if (params.postIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from("post_likes")
    .select("post_id")
    .select("post_id, user_id") // 👈 이거 추가
    .eq("user_id", params.userId)
    .in("post_id", params.postIds)

  if (error) {
    throw error
  }

  return data ?? []
}