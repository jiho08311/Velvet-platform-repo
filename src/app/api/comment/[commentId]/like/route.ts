import { NextResponse } from "next/server"

import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import {
  executeCommentLike,
  executeCommentUnlike,
} from "@/modules/post/public/execute-post-interaction"

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

  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!commentId) {
    return NextResponse.json(
      { error: "Comment id is required" },
      { status: 400 }
    )
  }

  try {
    const result = await executeCommentLike({
      commentId,
      userId: user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to like comment",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const { commentId } = await context.params

  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!commentId) {
    return NextResponse.json(
      { error: "Comment id is required" },
      { status: 400 }
    )
  }

  try {
    const result = await executeCommentUnlike({
      commentId,
      userId: user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to unlike comment",
      },
      { status: 500 }
    )
  }
}
