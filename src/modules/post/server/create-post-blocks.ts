import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { CreatePostPersistedBlockRowInput } from "../types"

export async function createPostBlocks(
  postId: string,
  persistedBlocks: CreatePostPersistedBlockRowInput[]
) {
  if (!persistedBlocks || persistedBlocks.length === 0) {
    return
  }

  const rows = persistedBlocks.map((block) => ({
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
