import { NextResponse } from "next/server"
import { canDeleteComment } from "@/modules/post/public/comment-permissions"
import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import {
  createCommentItem,
  type CommentRow,
  type CommentItemProfile,
} from "@/modules/post/public/comment-item"
import {
  incrementLikeCountMap,
  readLikeCountFromMap,
} from "@/shared/lib/like-interaction-result"
import { findCommentLikesByCommentIds } from "@/modules/post/public/comment-data"
import {
  findCommentAuthorProfiles,
  findCommentsByPostId,
} from "@/modules/post/public/comment-data"
type RouteContext = {
  params: Promise<{
    postId: string
  }>
}



export async function GET(
  request: Request,
  context: RouteContext
) {
  const { postId } = await context.params

  if (!postId) {
    return NextResponse.json({ error: "Post id is required" }, { status: 400 })
  }

  const user = await getCurrentUser()

  const currentUserId = user?.id ?? null

let comments: CommentRow[]

try {
  comments = await findCommentsByPostId(postId)
} catch (error) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Failed to load comments" },
    { status: 500 }
  )
}

  const commentIds = (comments ?? []).map((comment) => comment.id)

let likeRows = []

try {
  likeRows = await findCommentLikesByCommentIds(commentIds)
} catch (error) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Failed to load comment likes" },
    { status: 500 }
  )
}

  const likeCountMap = new Map<string, number>()

  for (const row of likeRows ?? []) {
    incrementLikeCountMap(likeCountMap, row.comment_id)
  }

  const likedCommentIdSet = new Set(
    currentUserId
      ? (likeRows ?? [])
          .filter((row) => row.user_id === currentUserId)
          .map((row) => row.comment_id)
      : []
  )

  const userIds = Array.from(
    new Set((comments ?? []).map((comment) => comment.user_id).filter(Boolean))
  )

let profileMap = new Map<string, CommentItemProfile & { id: string }>()

try {
  const profiles = await findCommentAuthorProfiles(userIds)
  profileMap = new Map(profiles.map((profile) => [profile.id, profile]))
} catch (error) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Failed to load profiles" },
    { status: 500 }
  )
}

  const items = (comments ?? []).map((comment) => {
    const profile = profileMap.get(comment.user_id)

    return createCommentItem({
  comment,
  profile,
  likesCount: readLikeCountFromMap(likeCountMap, comment.id),
  viewerHasLiked: likedCommentIdSet.has(comment.id),
canDelete: canDeleteComment({
  currentUserId,
  commentUserId: comment.user_id,
}),
})
  })

  return NextResponse.json({ items })
}
