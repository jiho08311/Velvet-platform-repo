import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { PostBlockEditorState } from "../types"



export type PostBlockRow = {
  id: string
  post_id: string
  type: string
  content: string | null
  media_id: string | null
  sort_order: number
  created_at: string
  editor_state: unknown | null
}

export type InsertPostBlockRow = {
  post_id: string
  type: string
  content: string | null
  media_id: string | null
  sort_order: number
  editor_state: unknown | null
}

export type CreatorStudioPostBlockRow = {
  id: string
  post_id: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  media_id: string | null
  sort_order: number
  created_at: string
  editor_state: unknown | null
}

export type ListCreatorPostBlockRow = {
  id: string
  post_id: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  media_id: string | null
  sort_order: number
  created_at: string
  editor_state: PostBlockEditorState | null
}

export async function findPostBlocksByPostIds(
  postIds: string[]
): Promise<CreatorStudioPostBlockRow[]> {
  if (postIds.length === 0) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from("post_blocks")
    .select("id, post_id, type, content, media_id, sort_order, created_at, editor_state")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true })
    .returns<CreatorStudioPostBlockRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findListCreatorPostBlocksByPostIds(
  postIds: string[]
): Promise<ListCreatorPostBlockRow[]> {
  if (postIds.length === 0) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from("post_blocks")
    .select("id, post_id, type, content, media_id, sort_order, created_at, editor_state")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true })
    .returns<ListCreatorPostBlockRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}



export async function deletePostBlocksByPostId(
  postId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("post_blocks")
    .delete()
    .eq("post_id", postId)

  if (error) {
    throw error
  }
}

export async function findPostBlocksByPostId(
  postId: string
): Promise<PostBlockRow[]> {
  const { data, error } = await supabaseAdmin
    .from("post_blocks")
    .select("*")
    .eq("post_id", postId)
    .order("sort_order", { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function insertPostBlocks(
  rows: InsertPostBlockRow[]
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("post_blocks")
    .insert(rows)

  if (error) {
    throw error
  }
}
