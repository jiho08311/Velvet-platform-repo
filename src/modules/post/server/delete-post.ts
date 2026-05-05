import { softDeletePostByCreator } from "@/modules/post/repositories/post-repository"

type DeletePostParams = {
  postId: string
  creatorId: string
}

export async function deletePost({
  postId,
  creatorId,
}: DeletePostParams): Promise<void> {
  const now = new Date().toISOString()

  await softDeletePostByCreator({
    postId,
    creatorId,
    deletedAt: now,
    updatedAt: now,
  })
}