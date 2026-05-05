import {
  getPostById as getPostByIdInternal,
  type PostDetail,
} from "@/modules/post/server/get-post-by-id"

export type { PostDetail }

export async function getPostById(
  postId: string,
  viewerUserId?: string | null
): Promise<PostDetail | null> {
  return getPostByIdInternal(postId, viewerUserId)
}