import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"

export type PostMediaItem = {
  id: string
  postId: string
  type: "image" | "video" | "audio" | "file"
  url: string
  sortOrder: number
}

type MediaRow = {
  id: string
  post_id: string
  type: "image" | "video" | "audio" | "file"
  storage_path: string
  sort_order: number
}

export async function getPostMedia(postId: string): Promise<PostMediaItem[]> {
  const id = postId.trim()
  if (!id) return []

  const { data, error } = await supabaseAdmin
    .from("media")
    .select("id, post_id, type, storage_path, sort_order")
    .eq("post_id", id)
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  if (error) {
    throw error
  }

  const mediaList = data ?? []

  return Promise.all(
    mediaList.map(async (media) => ({
      id: media.id,
      postId: media.post_id,
      type: media.type,
      url: await createMediaSignedUrl({
        storagePath: media.storage_path,
      }),
      sortOrder: media.sort_order,
    }))
  )
}