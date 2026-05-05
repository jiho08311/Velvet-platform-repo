import { canCreateMediaSignedUrl } from "@/modules/media/policies/media-access-policy"
import { createMediaStorageSignedUrl } from "@/modules/media/repositories/media-storage-repository"

type CreateMediaSignedUrlInput = {
  storagePath: string
  viewerUserId?: string | null
  creatorUserId?: string | null
  visibility: "public" | "subscribers" | "paid"
  canView?: boolean
  isSubscribed?: boolean
  hasPurchased?: boolean
  expiresIn?: number
  allowPreview?: boolean
}

export async function createMediaSignedUrl({
  storagePath,
  viewerUserId,
  creatorUserId,
  visibility,
  canView,
  isSubscribed = false,
  hasPurchased = false,
  expiresIn = 60 * 60,
  allowPreview = false,
}: CreateMediaSignedUrlInput): Promise<string> {
  const resolvedStoragePath = storagePath?.trim() ?? ""
  const resolvedViewerUserId = viewerUserId?.trim() ?? ""
  const resolvedCreatorUserId = creatorUserId?.trim() ?? ""

  if (!resolvedStoragePath) {
    return ""
  }

  const canSignUrl = canCreateMediaSignedUrl({
    viewerUserId: resolvedViewerUserId,
    creatorUserId: resolvedCreatorUserId,
    visibility,
    canView,
    isSubscribed,
    hasPurchased,
    allowPreview,
  })

  if (!canSignUrl) {
    return ""
  }

  return createMediaStorageSignedUrl({
    storagePath: resolvedStoragePath,
    expiresIn,
  })
}
