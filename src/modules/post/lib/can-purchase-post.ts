import type { Post } from "../types"

type CanPurchasePostParams = {
  post: Post
  isOwner: boolean
  hasPurchased: boolean
  isSubscribed: boolean
}

export function canPurchasePost({
  post,
  isOwner,
  hasPurchased,
  isSubscribed,
}: CanPurchasePostParams): boolean {
  if (isOwner) {
    return false
  }

  if (hasPurchased) {
    return false
  }

  if (post.visibility !== "paid") {
    return false
  }

  if (post.price <= 0) {
    return false
  }

  if (isSubscribed) {
    return false
  }

  return true
}