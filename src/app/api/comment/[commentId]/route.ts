import { NextResponse } from "next/server"
import { canDeleteComment } from "@/modules/post/public/comment-permissions"
import {
  findCommentForDelete,
  softDeleteComment,
} from "@/modules/post/public/comment-data"
import { getCurrentUser } from "@/modules/auth/public/get-current-user"

type RouteContext = {
  params: Promise<{
    commentId: string
  }>
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
    return NextResponse.json({ error: "Comment id is required" }, { status: 400 })
  }

let comment: {
  id: string
  user_id: string
}

try {
  comment = await findCommentForDelete(commentId)
} catch {
  return NextResponse.json({ error: "Comment not found" }, { status: 404 })
}

  if (
    !canDeleteComment({
      currentUserId: user.id,
      commentUserId: comment.user_id,
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

try {
  await softDeleteComment(commentId)
} catch (error) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Failed to delete comment" },
    { status: 500 }
  )
}

  return NextResponse.json({ ok: true })
}
