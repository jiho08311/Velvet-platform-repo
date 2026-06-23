import { readPostAuthority } from "@/modules/post/repositories/post-read-authority-repository"

export const PUBLIC_CONTRACT = true

export type PostPurchaseReadModel = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number
}

export async function readPostPurchaseReadModel(
  postId: string
): Promise<PostPurchaseReadModel> {
const post = await readPostAuthority(postId)

  if (!post) {
    throw new Error("Post not found")
  }

  return {
    id: post.id,
    creator_id: post.creator_id,
    title: post.title,
    content: post.content,
    visibility: post.visibility,
    price: post.price ?? 0,
  }
}
