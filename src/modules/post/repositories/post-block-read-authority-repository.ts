import {
  findCanonicalPostBlocksByPostId,
  type CanonicalPostBlockRow,
} from "./canonical-post-block-repository"
import type { PostBlockRow } from "./post-block-repository"

function toLegacyPostBlockRows(
  blocks: CanonicalPostBlockRow[]
): PostBlockRow[] {
  return blocks.map((block) => ({
    id: block.block_id,
    post_id: block.post_id,
    type: block.block_type,
    content: block.content,
    media_id: block.media_id,
    sort_order: block.sort_order,
    created_at: block.created_at,
    editor_state: block.editor_state,
  }))
}

export async function readPostBlockAuthority(
  postId: string
): Promise<PostBlockRow[]> {
  const canonicalBlocks = await findCanonicalPostBlocksByPostId(postId)

  return toLegacyPostBlockRows(canonicalBlocks)
}