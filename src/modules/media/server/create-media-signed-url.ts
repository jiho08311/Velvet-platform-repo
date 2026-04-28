import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { canViewPost } from "@/modules/post/server/can-view-post"

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

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

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

  const isOwner =
    resolvedViewerUserId.length > 0 &&
    resolvedCreatorUserId.length > 0 &&
    resolvedViewerUserId === resolvedCreatorUserId

  const hasAccess = typeof canView === "boolean"
    ? canView
    : isOwner
    ? true
    : canViewPost({
        viewerUserId: resolvedViewerUserId,
        creatorUserId: resolvedCreatorUserId,
        visibility,
        isSubscribed,
        hasPurchased,
      })

  if (!hasAccess && !allowPreview) {
    return ""
  }

  const { data, error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(resolvedStoragePath, expiresIn)

  if (error) {
    return ""
  }

  return data?.signedUrl ?? ""
}
