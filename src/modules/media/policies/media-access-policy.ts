import { canViewPost } from "@/modules/post/public/can-view-post"

type CanCreateMediaSignedUrlInput = {
  viewerUserId: string
  creatorUserId: string
  visibility: "public" | "subscribers" | "paid"
  canView?: boolean
  isSubscribed: boolean
  hasPurchased: boolean
  allowPreview: boolean
}

export function canCreateMediaSignedUrl({
  viewerUserId,
  creatorUserId,
  visibility,
  canView,
  isSubscribed,
  hasPurchased,
  allowPreview,
}: CanCreateMediaSignedUrlInput): boolean {
  const isOwner =
    viewerUserId.length > 0 &&
    creatorUserId.length > 0 &&
    viewerUserId === creatorUserId

  const hasAccess = typeof canView === "boolean"
    ? canView
    : isOwner
    ? true
    : canViewPost({
        viewerUserId,
        creatorUserId,
        visibility,
        isSubscribed,
        hasPurchased,
      })

  return hasAccess || allowPreview
}
