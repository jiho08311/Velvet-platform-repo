import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { getPostById } from "@/modules/post/server/get-post-by-id"
import { createMediaSignedUrl } from "./create-media-signed-url"

type SecureMediaItem = {
  id: string
  postId: string
  type: "image" | "video" | "audio" | "file"
  url: string
  mimeType: string | null
  sortOrder: number
}

type MediaRow = {
  id: string
  post_id: string
  type: "image" | "video" | "audio" | "file"
  storage_path: string
  mime_type: string | null
  sort_order: number
  status: "processing" | "ready" | "failed"
}

export async function getSecurePostMedia({
  postId,
  viewerUserId,
}: {
  postId: string
  viewerUserId?: string | null
}): Promise<SecureMediaItem[]> {
  const post = await getPostById(postId, viewerUserId ?? null)

  if (!post || post.isLocked) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from("media")
    .select("id, post_id, type, storage_path, mime_type, sort_order, status")
    .eq("post_id", postId)
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  if (error) throw error

  return Promise.all(
    (data ?? []).map(async (media) => {
      const url = await createMediaSignedUrl({
        storagePath: media.storage_path,
        viewerUserId: viewerUserId ?? "",
        creatorUserId: post.creatorUserId,
        visibility: post.visibility,
        hasPurchased: !post.isLocked,
      })

      return {
        id: media.id,
        postId: media.post_id,
        type: media.type,
        url,
        mimeType: media.mime_type,
        sortOrder: media.sort_order,
      }
    })
  )
}