import {
  getPostById as getPostByIdInternal,
} from "@/modules/post/runtime/get-post-by-id"

export const PUBLIC_CONTRACT = true

export type PostDetail = NonNullable<Awaited<ReturnType<typeof getPostByIdInternal>>>

export async function getPostById(
  postId: string,
  viewerUserId?: string | null
): Promise<PostDetail | null> {
  return getPostByIdInternal(postId, viewerUserId)
}
