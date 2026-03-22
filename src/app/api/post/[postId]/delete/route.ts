import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { deletePost } from "@/modules/post/server/delete-post"

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

    const user = await requireUser()
    const creator = await getCreatorByUserId(user.id)

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