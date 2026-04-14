import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { CreatePostBlockInput } from "../types"

export async function createPostBlocks(
  postId: string,
  blocks: CreatePostBlockInput[]
) {
  if (!blocks || blocks.length === 0) {
    return
  }

  const rows = blocks.map((block) => ({
    post_id: postId,
    type: block.type,
    content: block.content ?? null,
    media_id: block.mediaId ?? null,
    sort_order: block.sortOrder,
    editor_state: block.editorState ?? null,
  }))

  const { error } = await supabaseAdmin
    .from("post_blocks")
    .insert(rows)

  if (error) {
    throw error
  }
}