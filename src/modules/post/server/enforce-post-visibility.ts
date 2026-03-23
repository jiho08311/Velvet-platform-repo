import type { Post } from "../types"

type EnforcePostVisibilityParams = {
  post: Post
  isOwner: boolean
  isSubscribed: boolean
  hasPurchased: boolean
}

export function enforcePostVisibility({
  post,
  isOwner,
  isSubscribed,
  hasPurchased,
}: EnforcePostVisibilityParams): boolean {
  if (isOwner) {
    return true
  }

  if (post.visibility === "public") {
    return true
  }

  if (post.visibility === "subscribers") {
    return isSubscribed
  }

  if (post.visibility === "paid") {
    return hasPurchased
  }

  return false
}