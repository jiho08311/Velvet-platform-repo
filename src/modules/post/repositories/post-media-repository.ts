import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type PostMediaRow = {
  id: string
  post_id: string
  type: "image" | "video" | "audio" | "file"
  storage_path: string
  mime_type: string | null
  sort_order: number
  status: "processing" | "ready" | "failed"
}

export type PostMediaModerationStatusRow = {
  moderation_status: string | null
}


export type MyPostsMediaRow = {
  id: string
  post_id: string
  storage_path: string
  type: "image" | "video" | "audio" | "file" | null
  mime_type: string | null
  sort_order: number
  status: "processing" | "ready" | "failed"
}

export async function findMyPostMediaRowsByPostIds(
  postIds: string[]
): Promise<MyPostsMediaRow[]> {
  if (postIds.length === 0) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from("media")
    .select("id, post_id, storage_path, type, mime_type, sort_order, status")
    .in("post_id", postIds)
    .in("status", ["processing", "ready"])
    .order("sort_order", { ascending: true })
    .returns<MyPostsMediaRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}




export async function deletePostMediaRowsByIds({
  postId,
  mediaIds,
}: {
  postId: string
  mediaIds: string[]
}): Promise<void> {
  if (mediaIds.length === 0) {
    return
  }

  const { error } = await supabaseAdmin
    .from("media")
    .delete()
    .eq("post_id", postId)
    .in("id", mediaIds)

  if (error) {
    throw error
  }
}

export async function findPostMediaModerationStatusesByPostId(
  postId: string
): Promise<PostMediaModerationStatusRow[]> {
  const { data, error } = await supabaseAdmin
    .from("media")
    .select("moderation_status")
    .eq("post_id", postId)
    .returns<PostMediaModerationStatusRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findPostMediaRowsByPostId(
  postId: string
): Promise<PostMediaRow[]> {
  const { data, error } = await supabaseAdmin
    .from("media")
    .select("id, post_id, type, storage_path, mime_type, sort_order, status")
    .eq("post_id", postId)
    .in("status", ["processing", "ready"])
    .order("sort_order", { ascending: true })
    .returns<PostMediaRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}