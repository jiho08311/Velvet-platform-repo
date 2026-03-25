import { supabaseAdmin } from "@/infrastructure/supabase/admin"

import type { Media, MediaStatus, MediaType } from "../types"

type CreateMediaInput = {
  postId: string
  type: MediaType
  storagePath: string
  mimeType?: string
  sortOrder?: number
  status?: MediaStatus
}

type MediaRow = {
  id: string
  post_id: string
  type: MediaType
  storage_path: string
  mime_type: string | null
  sort_order: number
  status: MediaStatus
  created_at: string
}

export async function createMedia({
  postId,
  type,
  storagePath,
  mimeType,
  sortOrder = 0,
  status = "processing",
}: CreateMediaInput): Promise<Media> {
  const resolvedPostId = postId.trim()
  const resolvedStoragePath = storagePath.trim()

  if (!resolvedPostId) {
    throw new Error("postId is required")
  }

  if (!resolvedStoragePath) {
    throw new Error("storagePath is required")
  }

  const { data, error } = await supabaseAdmin
    .from("media")
    .insert({
      post_id: resolvedPostId,
      type,
      storage_path: resolvedStoragePath,
      mime_type: mimeType ?? null,
      sort_order: sortOrder,
      status,
    })
    .select(
      "id, post_id, type, storage_path, mime_type, sort_order, status, created_at"
    )
    .single<MediaRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    postId: data.post_id,
    type: data.type,
    storagePath: data.storage_path,
    mimeType: data.mime_type,
    sortOrder: data.sort_order,
    status: data.status,
    createdAt: data.created_at,
  }
}