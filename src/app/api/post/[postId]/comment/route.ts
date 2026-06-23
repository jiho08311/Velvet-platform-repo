import { NextResponse } from "next/server"

import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import { executeCreatePostComment } from "@/modules/post/public/execute-post-interaction"

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

  const user = await getCurrentUser()

  if (!user) {
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

  try {
    const result = await executeCreatePostComment({
      postId,
      userId: user.id,
      content,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create comment",
      },
      { status: 500 }
    )
  }
}
