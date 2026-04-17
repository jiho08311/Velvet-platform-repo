import type { Post } from "../types"
import { canViewPost } from "./can-view-post"

type EnforcePostVisibilityParams = {
  post: Post
  creatorUserId: string
  viewerUserId?: string | null
  isSubscribed: boolean
  hasPurchased: boolean
}

export function enforcePostVisibility({
  post,
  creatorUserId,
  viewerUserId,
  isSubscribed,
  hasPurchased,
}: EnforcePostVisibilityParams): boolean {
  return canViewPost({
    viewerUserId: viewerUserId ?? null,
    creatorUserId,
    visibility: post.visibility,
    isSubscribed,
    hasPurchased,
  })
}