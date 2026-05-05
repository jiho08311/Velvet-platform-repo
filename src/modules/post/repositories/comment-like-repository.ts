import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type CommentLikeRow = {
  comment_id: string
  user_id: string
}

const EMPTY_COMMENT_ID = "00000000-0000-0000-0000-000000000000"

export async function createCommentLike(input: {
  commentId: string
  userId: string
}) {
  const { error } = await supabaseAdmin
    .from("comment_likes")
    .insert({
      comment_id: input.commentId,
      user_id: input.userId,
    })

  if (error) {
    throw error
  }
}

export async function deleteCommentLike(input: {
  commentId: string
  userId: string
}) {
  const { error } = await supabaseAdmin
    .from("comment_likes")
    .delete()
    .eq("comment_id", input.commentId)
    .eq("user_id", input.userId)

  if (error) {
    throw error
  }
}

export async function countCommentLikes(commentId: string) {
  const { count, error } = await supabaseAdmin
    .from("comment_likes")
    .select("*", { count: "exact", head: true })
    .eq("comment_id", commentId)

  if (error) {
    throw error
  }

  return count
}

export async function findCommentLikesByCommentIds(commentIds: string[]) {
  const { data, error } = await supabaseAdmin
    .from("comment_likes")
    .select("comment_id, user_id")
    .in("comment_id", commentIds.length > 0 ? commentIds : [EMPTY_COMMENT_ID])
    .returns<CommentLikeRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}