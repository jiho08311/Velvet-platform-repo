import { NextResponse } from "next/server"

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { createNotification } from "@/modules/notification/server/create-notification"
import { createInteractionNotificationInput } from "@/modules/notification/server/create-interaction-notification-input"
import { createLikeInteractionResult } from "@/shared/lib/like-interaction-result"

type RouteContext = {
  params: Promise<{
    commentId: string
  }>
}

type CommentOwnerRow = {
  id: string
  user_id: string
  post_id: string
}

async function getCommentLikesCount(commentId: string) {
  const { count, error } = await supabaseAdmin
    .from("comment_likes")
    .select("*", { count: "exact", head: true })
    .eq("comment_id", commentId)

  if (error) {
    throw error
  }

  return count
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  const { commentId } = await context.params

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!commentId) {
    return NextResponse.json({ error: "Comment id is required" }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("comment_likes")
    .insert({
      comment_id: commentId,
      user_id: user.id,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: comment } = await supabaseAdmin
    .from("comments")
    .select("id, user_id, post_id")
    .eq("id", commentId)
    .single<CommentOwnerRow>()

  if (comment?.user_id) {
    const notificationInput = createInteractionNotificationInput({
      type: "comment_liked",
      actorUserId: user.id,
      recipientUserId: comment.user_id,
      postId: comment.post_id,
      commentId: comment.id,
    })

    if (notificationInput) {
      await createNotification(notificationInput)
    }
  }

  const likesCount = await getCommentLikesCount(commentId)

  return NextResponse.json(
    createLikeInteractionResult({
      targetType: "comment",
      targetId: commentId,
      viewerHasLiked: true,
      likesCount,
    })
  )
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const { commentId } = await context.params

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!commentId) {
    return NextResponse.json({ error: "Comment id is required" }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("comment_likes")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const likesCount = await getCommentLikesCount(commentId)

  return NextResponse.json(
    createLikeInteractionResult({
      targetType: "comment",
      targetId: commentId,
      viewerHasLiked: false,
      likesCount,
    })
  )
}
