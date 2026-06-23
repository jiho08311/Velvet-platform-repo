import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { CommentRow } from "@/modules/post/types"
import { readCreatorIdentityByCreatorId } from "@/modules/identity/public/creator-identity-read-model"

type ProfileRow = {
  id: string
  username: string | null
  avatar_url: string | null
}

export async function createComment(input: {
  postId: string
  userId: string
  content: string
}) {
  const { data, error } = await supabaseAdmin
    .from("comments")
    .insert({
      post_id: input.postId,
      user_id: input.userId,
      content: input.content,
    })
    .select("id, post_id, user_id, content, created_at")
    .single<CommentRow>()

  if (error) throw error
  return data
}

export async function findCommentAuthorProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id, username, avatar_url")
    .eq("profile_id", userId)
    .single<{
      profile_id: string
      username: string | null
      avatar_url: string | null
    }>()

  if (error) throw error

  return {
    id: data.profile_id,
    username: data.username,
    avatar_url: data.avatar_url,
  } satisfies ProfileRow
}

export async function findPostOwner(postId: string) {
  const { data, error } = await supabaseAdmin
    .from("canonical_posts")
    .select("post_id, creator_id")
    .eq("post_id", postId)
    .single<{
      post_id: string
      creator_id: string
    }>()

  if (error) throw error

  return {
    id: data.post_id,
    creator_id: data.creator_id,
  }
}

export async function findCreatorUser(creatorId: string) {
  const creator = await readCreatorIdentityByCreatorId(creatorId)

  if (!creator) {
    throw new Error("Creator not found")
  }

  return {
    id: creator.id,
    user_id: creator.userId,
  }
}

export async function findCommentsByPostId(postId: string) {
  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("id, post_id, user_id, content, created_at")
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<CommentRow[]>()

  if (error) throw error
  return data ?? []
}

export async function findCommentAuthorProfiles(userIds: string[]) {
  if (userIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id, username, avatar_url")
    .in("profile_id", userIds)
    .returns<
      Array<{
        profile_id: string
        username: string | null
        avatar_url: string | null
      }>
    >()

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.profile_id,
    username: row.username,
    avatar_url: row.avatar_url,
  }))
}

export async function findCommentForDelete(commentId: string) {
  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("id, user_id")
    .eq("id", commentId)
    .is("deleted_at", null)
    .single()

  if (error) throw error
  return data
}

export async function findCommentOwnerForNotification(commentId: string) {
  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("id, user_id, post_id")
    .eq("id", commentId)
    .single()

  if (error) throw error
  return data
}

export async function softDeleteComment(commentId: string) {
  const { error } = await supabaseAdmin
    .from("comments")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", commentId)

  if (error) throw error
}

export async function countCommentsByPostId(postId: string) {
  const { count, error } = await supabaseAdmin
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)
    .is("deleted_at", null)

  if (error) throw error
  return count ?? 0
}

export async function countCommentsByPostIds(postIds: string[]) {
  if (postIds.length === 0) return new Map<string, number>()

  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("post_id")
    .in("post_id", postIds)
    .is("deleted_at", null)

  if (error) throw error

  const map = new Map<string, number>()

  for (const row of data ?? []) {
    map.set(row.post_id, (map.get(row.post_id) ?? 0) + 1)
  }

  return map
}