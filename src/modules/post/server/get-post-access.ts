import { canViewPost } from "./can-view-post"
import type { PostAccessLockReason, PostAccessResult } from "../types"

type GetPostAccessInput = {
  viewerUserId: string | null
  post: {
    id: string
    creatorId: string
    content?: string
    visibility: "public" | "subscribers" | "paid"
    price: number
    createdAt: string
  }
  creator: {
    userId: string
  }
  isSubscribedResult: boolean
  hasPurchasedResult: boolean
}

export async function getPostAccess({
  viewerUserId,
  post,
  creator,
  isSubscribedResult,
  hasPurchasedResult,
}: GetPostAccessInput): Promise<PostAccessResult> {
  const canView = canViewPost({
    viewerUserId: viewerUserId ?? null,
    creatorUserId: creator.userId,
    visibility: post.visibility,
    isSubscribed: isSubscribedResult,
    hasPurchased: hasPurchasedResult,
  })

  const lockReason: PostAccessLockReason = canView
    ? "none"
    : post.visibility === "paid"
      ? "purchase"
      : post.visibility === "subscribers"
        ? "subscription"
        : "none"

  return {
    canView,
    locked: !canView,
    lockReason,
  }
}
