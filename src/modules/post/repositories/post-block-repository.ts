import { supabaseAdmin } from "@/infrastructure/supabase/admin"

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