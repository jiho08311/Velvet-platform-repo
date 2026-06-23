import { NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"
import { getCreatorByUserId } from "@/modules/creator/public/get-creator-by-user-id"
import { deletePost } from "@/modules/post/public/delete-post"

type DeletePostRouteParams = {
  params: Promise<{
    postId: string
  }>
}

export async function POST(
  _request: Request,
  { params }: DeletePostRouteParams,
) {
  try {
    const { postId } = await params

    const session = await requireSession()
    const creator = await getCreatorByUserId(session.userId)

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 },
      )
    }

    await deletePost({
      postId,
      creatorId: creator.id,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete post"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}