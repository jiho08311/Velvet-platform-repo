import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { canViewPost } from "@/modules/post/server/can-view-post"

type CreateMediaSignedUrlInput = {
  storagePath: string
  viewerUserId?: string | null
  creatorUserId?: string | null
  visibility: "public" | "subscribers" | "paid"
  isSubscribed?: boolean
  hasPurchased?: boolean
  expiresIn?: number
}

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

export async function createMediaSignedUrl({
  storagePath,
  viewerUserId,
  creatorUserId,
  visibility,
  isSubscribed = false,
  hasPurchased = false,
  expiresIn = 60 * 60,
}: CreateMediaSignedUrlInput): Promise<string> {
  const resolvedStoragePath = storagePath?.trim() ?? ""
  const resolvedViewerUserId = viewerUserId?.trim() ?? ""
  const resolvedCreatorUserId = creatorUserId?.trim() ?? ""

  if (!resolvedStoragePath) {
    return ""
  }

  // ✅ 최소 수정: creator 본인은 무조건 접근 허용
  const isOwner =
    resolvedViewerUserId.length > 0 &&
    resolvedCreatorUserId.length > 0 &&
    resolvedViewerUserId === resolvedCreatorUserId

  const hasAccess = isOwner
    ? true
    : canViewPost({
        viewerUserId: resolvedViewerUserId,
        creatorId: resolvedCreatorUserId,
        visibility,
        isSubscribed,
        hasPurchased,
      })

  if (!hasAccess) {
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