import { CreatePostPersistedBlockRowInput } from "../types"
import { insertPostBlocks } from "../repositories/post-block-repository"

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

  await insertPostBlocks(rows)
}