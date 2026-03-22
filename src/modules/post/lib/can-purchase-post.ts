import type { Post } from "../types"

export type CanPurchasePostInput = {
  viewerUserId: string | null
  creatorId: string
  post: Post
  hasPurchased?: boolean
}

export function canPurchasePost(input: CanPurchasePostInput): boolean {
  const { viewerUserId, creatorId, post, hasPurchased = false } = input

  if (!viewerUserId) {
    return false
  }

  // Creator cannot purchase their own post
  if (viewerUserId === creatorId) {
    return false
  }

  // Already purchased
  if (hasPurchased) {
    return false
  }

  // Only locked posts can be purchased
  if (!post.isLocked) {
    return false
  }

  return true
}