import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { createNotification } from "@/modules/notification/server/create-notification"
import { createInteractionNotificationInput } from "@/modules/notification/server/create-interaction-notification-input"
import {
  countPostLikes,
  deletePostLike,
  findCreatorUser,
  findPostOwner,
  insertPostLike,
} from "@/modules/post/public/post-like"
import { createLikeInteractionResult } from "@/shared/lib/like-interaction-result"

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

  if (!postId) {
    return NextResponse.json({ error: "Post id is required" }, { status: 400 })
  }

  try {
    await insertPostLike({
      postId,
      userId: user.id,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to like post" },
      { status: 500 }
    )
  }

  try {
    const post = await findPostOwner(postId)

    if (post?.creator_id) {
      const creator = await findCreatorUser(post.creator_id)

      if (creator?.user_id) {
        const notificationInput = createInteractionNotificationInput({
          type: "post_liked",
          actorUserId: user.id,
          recipientUserId: creator.user_id,
          postId,
          creatorId: post.creator_id,
        })

        if (notificationInput) {
          await createNotification(notificationInput)
        }
      }
    }
  } catch {
    // Preserve like success even if notification lookup fails.
  }

  const likesCount = await countPostLikes(postId)

  return NextResponse.json(
    createLikeInteractionResult({
      targetType: "post",
      targetId: postId,
      viewerHasLiked: true,
      likesCount,
    })
  )
}

export async function DELETE(
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

  if (!postId) {
    return NextResponse.json({ error: "Post id is required" }, { status: 400 })
  }

  try {
    await deletePostLike({
      postId,
      userId: user.id,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unlike post" },
      { status: 500 }
    )
  }

  const likesCount = await countPostLikes(postId)

  return NextResponse.json(
    createLikeInteractionResult({
      targetType: "post",
      targetId: postId,
      viewerHasLiked: false,
      likesCount,
    })
  )
}
