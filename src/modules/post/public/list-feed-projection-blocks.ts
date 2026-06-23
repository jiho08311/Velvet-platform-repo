import type { PostBlockEditorState } from "@/modules/post/types"
import {
  findFeedPostBlocksByPostIds,
} from "@/modules/post/repositories/post-feed-repository"

export const PUBLIC_CONTRACT = true

export type FeedProjectionBlockReadModel = {
  id: string
  postId: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  mediaId: string | null
  sortOrder: number
  createdAt: string
  editorState: PostBlockEditorState | null
}

export async function listFeedProjectionBlocksByPostIds(
  postIds: string[],
): Promise<FeedProjectionBlockReadModel[]> {
  const rows = await findFeedPostBlocksByPostIds(postIds)

  return rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    type: row.type,
    content: row.content,
    mediaId: row.media_id,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    editorState: row.editor_state,
  }))
}
