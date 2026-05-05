import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { MediaStatus, MediaType } from "../types"

const EMPTY_POST_ID = "00000000-0000-0000-0000-000000000000"

const READY_POST_MEDIA_SELECT_COLUMNS =
  "id, post_id, storage_path, type, mime_type, status, sort_order"

const READY_EXPLORE_POST_MEDIA_SELECT_COLUMNS =
  "id, post_id, storage_path, mime_type, sort_order, type"

export type ReadyPostMediaRow = {
  id: string
  post_id: string
  storage_path: string
  type: MediaType | null
  mime_type: string | null
  status: MediaStatus
  sort_order: number
}

export type ReadyExplorePostMediaRow = {
  id: string
  post_id: string
  storage_path: string
  mime_type: string | null
  sort_order: number
  type: Extract<MediaType, "image" | "video"> | null
}

export async function findReadyPostMediaRowsByPostIds(
  postIds: string[]
): Promise<ReadyPostMediaRow[]> {
  const safePostIds = postIds.length > 0 ? postIds : [EMPTY_POST_ID]

  const { data, error } = await supabaseAdmin
    .from("media")
    .select(READY_POST_MEDIA_SELECT_COLUMNS)
    .in("post_id", safePostIds)
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<ReadyPostMediaRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findReadyExplorePostMediaRowsByPostIds(
  postIds: string[]
): Promise<ReadyExplorePostMediaRow[]> {
  const safePostIds = postIds.length > 0 ? postIds : [EMPTY_POST_ID]

  const { data, error } = await supabaseAdmin
    .from("media")
    .select(READY_EXPLORE_POST_MEDIA_SELECT_COLUMNS)
    .in("post_id", safePostIds)
    .in("type", ["image", "video"])
    .eq("status", "ready")
    .order("sort_order", { ascending: true })
    .returns<ReadyExplorePostMediaRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}
