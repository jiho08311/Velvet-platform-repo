import {
  getPostByIdRuntime,
  type PostDetail,
} from "@/modules/post/runtime/get-post-by-id-runtime"

export type { PostDetail }

export async function getPostById(
  postId: string,
  viewerUserId?: string | null,
): Promise<PostDetail | null> {
  return getPostByIdRuntime(postId, viewerUserId)
}
