import { NextResponse } from "next/server"

import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import {
  executePostLike,
  executePostUnlike,
} from "@/modules/post/public/execute-post-interaction"

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

  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!postId) {
    return NextResponse.json(
      { error: "Post id is required" },
      { status: 400 }
    )
  }

  try {
    const result = await executePostLike({
      postId,
      userId: user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to like post",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const { postId } = await context.params

  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!postId) {
    return NextResponse.json(
      { error: "Post id is required" },
      { status: 400 }
    )
  }

  try {
    const result = await executePostUnlike({
      postId,
      userId: user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to unlike post",
      },
      { status: 500 }
    )
  }
}
