import { CreatePostPersistedBlockRowInput } from "../types"
import { replaceCanonicalPostBlocksForPost } from "../repositories/post-canonical-write-repository"

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

  await replaceCanonicalPostBlocksForPost({
    postId,
    blocks: rows,
  })
}