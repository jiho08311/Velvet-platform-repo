import {
  countPostLikes as countPostLikesUseCase,
  deletePostLike as deletePostLikeUseCase,
  findCreatorUser as findCreatorUserUseCase,
  findPostOwner as findPostOwnerUseCase,
  insertPostLike as insertPostLikeUseCase,
} from "@/modules/post/use-cases/post-like"

export const PUBLIC_CONTRACT = true

export type InsertPostLikeInput = Parameters<typeof insertPostLikeUseCase>[0]
export type DeletePostLikeInput = Parameters<typeof deletePostLikeUseCase>[0]
export type PostLikeCreatorUser = Awaited<ReturnType<typeof findCreatorUserUseCase>>
export type PostLikePostOwner = Awaited<ReturnType<typeof findPostOwnerUseCase>>

export async function countPostLikes(
  postId: string
): ReturnType<typeof countPostLikesUseCase> {
  return countPostLikesUseCase(postId)
}

export async function insertPostLike(
  input: InsertPostLikeInput
): ReturnType<typeof insertPostLikeUseCase> {
  return insertPostLikeUseCase(input)
}

export async function deletePostLike(
  input: DeletePostLikeInput
): ReturnType<typeof deletePostLikeUseCase> {
  return deletePostLikeUseCase(input)
}

export async function findCreatorUser(
  creatorId: string
): Promise<PostLikeCreatorUser> {
  return findCreatorUserUseCase(creatorId)
}

export async function findPostOwner(postId: string): Promise<PostLikePostOwner> {
  return findPostOwnerUseCase(postId)
}
