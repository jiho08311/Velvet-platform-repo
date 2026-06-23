import {
  deletePostMediaRowsByIds as deletePostMediaRowsByIdsRepository,
  findMyPostMediaRowsByPostIds as findMyPostMediaRowsByPostIdsRepository,
  findPostMediaModerationStatusesByPostId as findPostMediaModerationStatusesByPostIdRepository,
  findPostMediaRowsByPostId as findPostMediaRowsByPostIdRepository,
  findReadyPostMediaRowsByPostId as findReadyPostMediaRowsByPostIdRepository,
  findReadyPostMediaRowsByPostIds as findReadyPostMediaRowsByPostIdsRepository,
} from "@/modules/post/repositories/post-media-repository"

export const PUBLIC_CONTRACT = true

export type DeletePostMediaRowsByIdsInput = Parameters<
  typeof deletePostMediaRowsByIdsRepository
>[0]
export type MyPostsMediaRow = Awaited<
  ReturnType<typeof findMyPostMediaRowsByPostIdsRepository>
>[number]
export type PostMediaRow = Awaited<
  ReturnType<typeof findPostMediaRowsByPostIdRepository>
>[number]
export type PostMediaModerationStatusRow = Awaited<
  ReturnType<typeof findPostMediaModerationStatusesByPostIdRepository>
>[number]

export async function findMyPostMediaRowsByPostIds(
  postIds: string[]
): ReturnType<typeof findMyPostMediaRowsByPostIdsRepository> {
  return findMyPostMediaRowsByPostIdsRepository(postIds)
}

export async function deletePostMediaRowsByIds(
  input: DeletePostMediaRowsByIdsInput
): ReturnType<typeof deletePostMediaRowsByIdsRepository> {
  return deletePostMediaRowsByIdsRepository(input)
}

export async function findPostMediaModerationStatusesByPostId(
  postId: string
): ReturnType<typeof findPostMediaModerationStatusesByPostIdRepository> {
  return findPostMediaModerationStatusesByPostIdRepository(postId)
}

export async function findPostMediaRowsByPostId(
  postId: string
): ReturnType<typeof findPostMediaRowsByPostIdRepository> {
  return findPostMediaRowsByPostIdRepository(postId)
}

export async function findReadyPostMediaRowsByPostId(
  postId: string
): ReturnType<typeof findReadyPostMediaRowsByPostIdRepository> {
  return findReadyPostMediaRowsByPostIdRepository(postId)
}

export async function findReadyPostMediaRowsByPostIds(
  postIds: string[]
): ReturnType<typeof findReadyPostMediaRowsByPostIdsRepository> {
  return findReadyPostMediaRowsByPostIdsRepository(postIds)
}
