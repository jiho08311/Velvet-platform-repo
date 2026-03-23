import type { Post } from "../types"

type CanViewPostParams = {
  viewerUserId: string | null
  post: Post
  creatorUserId: string
  isSubscribed: boolean
  hasPurchased: boolean
}

export function canViewPost({
  viewerUserId,
  post,
  creatorUserId,
  isSubscribed,
  hasPurchased,
}: CanViewPostParams): boolean {
  if (viewerUserId === creatorUserId) {
    return true
  }

  if (post.visibility === "public" && post.priceCents === 0) {
    return true
  }

  if (post.visibility === "subscribers" && isSubscribed) {
    return true
  }

  if (post.visibility === "paid" && hasPurchased) {
    return true
  }

  return false
}