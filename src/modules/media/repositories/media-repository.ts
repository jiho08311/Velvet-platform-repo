import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { CreateMediaInsertPayload, MediaRow } from "../mappers/media-mapper"
import type { MediaStatus, MediaType } from "../types"

const MEDIA_SELECT_COLUMNS =
  "id, post_id, message_id, owner_user_id, type, storage_path, mime_type, sort_order, status, created_at"

const SECURE_POST_MEDIA_SELECT_COLUMNS =
  "id, post_id, type, storage_path, mime_type, sort_order, status"

export type SecurePostMediaRow = {
  id: string
  post_id: string
  type: MediaType
  storage_path: string
  mime_type: string | null
  sort_order: number
  status: MediaStatus
}

export async function insertMediaRow(
  insertPayload: CreateMediaInsertPayload
): Promise<MediaRow> {
  const { data, error } = await supabaseAdmin
    .from("media")
    .insert(insertPayload)
    .select(MEDIA_SELECT_COLUMNS)
    .single<MediaRow>()

  if (error) {
    throw error
  }

  return data
}

export async function findReadyPostMediaRowsByPostId(
  postId: string
): Promise<SecurePostMediaRow[]> {
  const { data, error } = await supabaseAdmin
    .from("media")
    .select(SECURE_POST_MEDIA_SELECT_COLUMNS)
    .eq("post_id", postId)
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<SecurePostMediaRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}
