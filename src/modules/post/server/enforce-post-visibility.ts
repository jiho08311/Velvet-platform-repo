import type { Post, PostAccessResult } from "../types"
import { getPostAccess } from "./get-post-access"

type EnforcePostVisibilityParams = {
  post: Post
  creatorUserId: string
  viewerUserId?: string | null
  isSubscribed: boolean
  hasPurchased: boolean
}

export async function enforcePostVisibility({
  post,
  creatorUserId,
  viewerUserId,
  isSubscribed,
  hasPurchased,
}: EnforcePostVisibilityParams): Promise<PostAccessResult> {
  return getPostAccess({
    viewerUserId: viewerUserId ?? null,
    post: {
      id: post.id,
      creatorId: post.creatorId,
      content: post.content ?? undefined,
      visibility: post.visibility,
      price: post.price ?? 0,
      createdAt: post.createdAt,
    },
    creator: {
      userId: creatorUserId,
    },
    isSubscribedResult: isSubscribed,
    hasPurchasedResult: hasPurchased,
  })
}
