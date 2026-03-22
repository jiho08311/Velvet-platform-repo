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

  if (post.visibility === "public" && post.price === null) {
    return true
  }

  if (post.visibility === "subscribers" && isSubscribed) {
    return true
  }

  if (post.price !== null && hasPurchased) {
    return true
  }

  return false
}