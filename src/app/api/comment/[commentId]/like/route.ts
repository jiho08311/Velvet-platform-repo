import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { createNotification } from "@/modules/notification/server/create-notification"
import { createInteractionNotificationInput } from "@/modules/notification/server/create-interaction-notification-input"
import {
  countCommentLikes,
  createCommentLike,
  deleteCommentLike,
  findCommentOwnerForNotification,
} from "@/modules/post/public/comment-like"
import { createLikeInteractionResult } from "@/shared/lib/like-interaction-result"

type RouteContext = {
  params: Promise<{
    commentId: string
  }>
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

  try {
    await createCommentLike({
      commentId,
      userId: user.id,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to like comment" },
      { status: 500 }
    )
  }

  try {
    const comment = await findCommentOwnerForNotification(commentId)

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
  } catch {
    // Preserve comment like success even if notification lookup fails.
  }

  const likesCount = await countCommentLikes(commentId)

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

  try {
    await deleteCommentLike({
      commentId,
      userId: user.id,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unlike comment" },
      { status: 500 }
    )
  }

  const likesCount = await countCommentLikes(commentId)

  return NextResponse.json(
    createLikeInteractionResult({
      targetType: "comment",
      targetId: commentId,
      viewerHasLiked: false,
      likesCount,
    })
  )
}
