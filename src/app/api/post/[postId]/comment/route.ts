import { NextResponse } from "next/server"

import {
  createComment,
  findCommentAuthorProfile,
  findCreatorUser,
  findPostOwner,
} from "@/modules/post/public/comment-data"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { createNotification } from "@/modules/notification/server/create-notification"
import { createInteractionNotificationInput } from "@/modules/notification/server/create-interaction-notification-input"
import {
  createCommentItem,
  type CommentItemProfile,
  type CommentRow,
} from "@/modules/post/public/comment-item"
import { canDeleteComment } from "@/modules/post/public/comment-permissions"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{
    postId: string
  }>
}


export async function POST(
  request: Request,
  context: RouteContext
) {
  const { postId } = await context.params

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const content =
    typeof body?.content === "string" ? body.content.trim() : ""

  if (!postId) {
    return NextResponse.json({ error: "Post id is required" }, { status: 400 })
  }

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  // 🔥 여기로 이동
  const { default: OpenAI } = await import("openai")

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const moderation = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: content,
  })

  const flagged = moderation.results[0]?.flagged ?? false

  if (flagged) {
    return NextResponse.json(
      { error: "Comment violates policy" },
      { status: 400 }
    )
  }

let insertedComment: CommentRow

try {
  insertedComment = await createComment({
    postId,
    userId: user.id,
    content,
  })
} catch (error) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Failed to create comment" },
    { status: 500 }
  )
}

let profile: CommentItemProfile

try {
  profile = await findCommentAuthorProfile(user.id)
} catch (error) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Failed to load profile" },
    { status: 500 }
  )
}

try {
  const post = await findPostOwner(postId)

  if (post?.creator_id) {
    const creator = await findCreatorUser(post.creator_id)

    if (creator?.user_id) {
      const notificationInput = createInteractionNotificationInput({
        type: "comment_created",
        actorUserId: user.id,
        recipientUserId: creator.user_id,
        postId,
        commentId: insertedComment.id,
        creatorId: post.creator_id,
      })

      if (notificationInput) {
        await createNotification(notificationInput)
      }
    }
  }
} catch {
  // Preserve comment creation success even if notification lookup fails.
}

  const item = createCommentItem({
    comment: insertedComment,
    profile,
    likesCount: 0,
    viewerHasLiked: false,
    canDelete: canDeleteComment({
      currentUserId: user.id,
      commentUserId: insertedComment.user_id,
    }),
  })

  return NextResponse.json({
    ok: true,
    item,
  })
}
