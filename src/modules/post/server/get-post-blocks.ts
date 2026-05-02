import { PostBlock } from "../types"
import { findPostBlocksByPostId } from "../repositories/post-block-repository"

export async function getPostBlocks(
  postId: string
): Promise<PostBlock[]> {
  const data = await findPostBlocksByPostId(postId)

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