// src/modules/post/public/post-interaction-read-model.ts
import {
  countCommentsByPostId as countCommentsByPostIdRepository,
  countCommentsByPostIds as countCommentsByPostIdsRepository,
  findCommentsByPostId as findCommentsByPostIdRepository,
} from "@/modules/post/repositories/comment-repository"
import {
  countPostLikes as countPostLikesRepository,
  findPostLikeRowsByPostIds as findPostLikeRowsByPostIdsRepository,
  findUserPostLikeRowsByPostIds as findUserPostLikeRowsByPostIdsRepository,
} from "@/modules/post/repositories/post-like-repository"

export const PUBLIC_CONTRACT = true

export type PostInteractionComment = Awaited<
  ReturnType<typeof findCommentsByPostIdRepository>
>[number]
export type PostLikeRow = Awaited<
  ReturnType<typeof findPostLikeRowsByPostIdsRepository>
>[number]
export type FindUserPostLikeRowsByPostIdsInput = Parameters<
  typeof findUserPostLikeRowsByPostIdsRepository
>[0]

export async function countCommentsByPostId(
  postId: string
): ReturnType<typeof countCommentsByPostIdRepository> {
  return countCommentsByPostIdRepository(postId)
}

export async function countCommentsByPostIds(
  postIds: string[]
): ReturnType<typeof countCommentsByPostIdsRepository> {
  return countCommentsByPostIdsRepository(postIds)
}

export async function findCommentsByPostId(
  postId: string
): ReturnType<typeof findCommentsByPostIdRepository> {
  return findCommentsByPostIdRepository(postId)
}

export async function countPostLikes(
  postId: string
): ReturnType<typeof countPostLikesRepository> {
  return countPostLikesRepository(postId)
}

export async function findPostLikeRowsByPostIds(
  postIds: string[]
): ReturnType<typeof findPostLikeRowsByPostIdsRepository> {
  return findPostLikeRowsByPostIdsRepository(postIds)
}

export async function findUserPostLikeRowsByPostIds(
  input: FindUserPostLikeRowsByPostIdsInput
): ReturnType<typeof findUserPostLikeRowsByPostIdsRepository> {
  return findUserPostLikeRowsByPostIdsRepository(input)
}
