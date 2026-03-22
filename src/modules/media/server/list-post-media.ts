import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type MediaRow = {
  id: string
  post_id: string
  type: "image" | "video" | "audio" | "file"
  status: "processing" | "ready" | "failed"
  storage_path: string
  mime_type: string | null
  sort_order: number
  created_at: string
}

export async function listPostMedia(postId: string): Promise<
  Array<{
    id: string
    postId: string
    type: "image" | "video" | "audio" | "file"
    status: "processing" | "ready" | "failed"
    storagePath: string
    mimeType?: string
    sortOrder: number
    createdAt: string
  }>
> {
  const id = postId.trim()

  if (!id) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from("media")
    .select(
      "id, post_id, type, status, storage_path, mime_type, sort_order, created_at"
    )
    .eq("post_id", id)
    .order("sort_order", { ascending: true })
    .returns<MediaRow[]>()

  if (error) {
    throw error
  }

  return (data ?? []).map((media) => ({
    id: media.id,
    postId: media.post_id,
    type: media.type,
    status: media.status,
    storagePath: media.storage_path,
    mimeType: media.mime_type ?? undefined,
    sortOrder: media.sort_order,
    createdAt: media.created_at,
  }))
}