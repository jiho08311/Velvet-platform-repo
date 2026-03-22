import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreateMediaInput = {
  postId: string
  type: "image" | "video" | "audio" | "file"
  storagePath: string
  mimeType?: string
  sortOrder?: number
  status?: "processing" | "ready" | "failed"
}

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

export async function createMedia({
  postId,
  type,
  storagePath,
  mimeType,
  sortOrder = 0,
  status = "processing",
}: CreateMediaInput): Promise<{
  id: string
  postId: string
  type: "image" | "video" | "audio" | "file"
  status: "processing" | "ready" | "failed"
  storagePath: string
  mimeType?: string
  sortOrder: number
  createdAt: string
}> {
  const { data, error } = await supabaseAdmin
    .from("media")
    .insert({
      post_id: postId,
      type,
      status,
      storage_path: storagePath,
      mime_type: mimeType,
      sort_order: sortOrder,
    })
    .select(
      "id, post_id, type, status, storage_path, mime_type, sort_order, created_at"
    )
    .single<MediaRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    postId: data.post_id,
    type: data.type,
    status: data.status,
    storagePath: data.storage_path,
    mimeType: data.mime_type ?? undefined,
    sortOrder: data.sort_order,
    createdAt: data.created_at,
  }
}