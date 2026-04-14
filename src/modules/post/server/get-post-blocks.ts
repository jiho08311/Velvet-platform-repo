import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { PostBlock } from "../types"

export async function getPostBlocks(
  postId: string
): Promise<PostBlock[]> {
  const { data, error } = await supabaseAdmin
    .from("post_blocks")
    .select("*")
    .eq("post_id", postId)
    .order("sort_order", { ascending: true })

  if (error) {
    throw error
  }

return (data ?? []).map((row) => ({
  id: row.id,
  postId: row.post_id,
  type: row.type,
  content: row.content,
  mediaId: row.media_id,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  editorState: row.editor_state ?? null,
}))
}