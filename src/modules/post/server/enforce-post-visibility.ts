import type { Post } from "../types"

export type EnforcePostVisibilityInput = {
  viewerUserId: string | null
  post: Post
  creatorId: string
  isSubscribed?: boolean
}

export function enforcePostVisibility(
  input: EnforcePostVisibilityInput
): true {
  const { viewerUserId, post, creatorId, isSubscribed = false } = input

  // Creator always has access to their own post
  if (viewerUserId && viewerUserId === creatorId) {
    return true
  }

  // Public posts are always accessible
  if (post.visibility === "public" && !post.isLocked) {
    return true
  }

  // Subscriber-only posts
  if (post.visibility === "subscribers") {
    if (!viewerUserId) {
      throw new Error("Authentication required to view this post")
    }

    if (!isSubscribed) {
      throw new Error("Subscription required to view this post")
    }

    return true
  }

  // Locked content requires subscription
  if (post.isLocked) {
    if (!viewerUserId) {
      throw new Error("Authentication required to view locked content")
    }

    if (!isSubscribed) {
      throw new Error("Subscription required to unlock this post")
    }

    return true
  }

  throw new Error("Access denied")
}