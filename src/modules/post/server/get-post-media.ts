import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"

export type PostMediaItem = {
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

export async function getPostMedia(postId: string): Promise<PostMediaItem[]> {
  const resolvedPostId = postId.trim()

  if (!resolvedPostId) {
    throw new Error("postId is required")
  }

  const { data, error } = await supabaseAdmin
    .from("media")
    .select("id, post_id, type, storage_path, mime_type, sort_order, status")
    .eq("post_id", resolvedPostId)
    .eq("status", "ready")
    // ❌ type 필터 제거 (이게 핵심)
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  if (error) {
    throw error
  }

  const rows = data ?? []

  return Promise.all(
    rows.map(async (media) => {
      const url = await createMediaSignedUrl({
        storagePath: media.storage_path,
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