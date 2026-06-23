import { readPostAuthority } from "@/modules/post/repositories/post-read-authority-repository"

export const PUBLIC_CONTRACT = true

export type PostModerationSource = {
  status: string | null
  publishedAt: string | null
}

export async function getPostModerationSource(
  postId: string
): Promise<PostModerationSource | null> {
const post = await readPostAuthority(postId)

  if (!post) {
    return null
  }

  return {
    status: post.status,
    publishedAt: post.published_at,
  }
}
