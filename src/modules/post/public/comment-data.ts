import {
  createComment as createCommentUseCase,
  findCommentAuthorProfile as findCommentAuthorProfileUseCase,
  findCommentAuthorProfiles as findCommentAuthorProfilesUseCase,
  findCommentForDelete as findCommentForDeleteUseCase,
  findCommentLikesByCommentIds as findCommentLikesByCommentIdsUseCase,
  findCommentsByPostId as findCommentsByPostIdUseCase,
  findCreatorUser as findCreatorUserUseCase,
  findPostOwner as findPostOwnerUseCase,
  softDeleteComment as softDeleteCommentUseCase,
} from "@/modules/post/use-cases/comment-data"

export const PUBLIC_CONTRACT = true

export type CreateCommentInput = Parameters<typeof createCommentUseCase>[0]
export type CommentDataRow = Awaited<ReturnType<typeof createCommentUseCase>>
export type CommentAuthorProfile = Awaited<
  ReturnType<typeof findCommentAuthorProfileUseCase>
>
export type CommentAuthorProfiles = Awaited<
  ReturnType<typeof findCommentAuthorProfilesUseCase>
>
export type CommentForDelete = Awaited<
  ReturnType<typeof findCommentForDeleteUseCase>
>
export type CommentLikeRows = Awaited<
  ReturnType<typeof findCommentLikesByCommentIdsUseCase>
>
export type PostOwner = Awaited<ReturnType<typeof findPostOwnerUseCase>>
export type CreatorUser = Awaited<ReturnType<typeof findCreatorUserUseCase>>

export async function createComment(
  input: CreateCommentInput
): Promise<CommentDataRow> {
  return createCommentUseCase(input)
}

export async function findCommentAuthorProfile(
  userId: string
): Promise<CommentAuthorProfile> {
  return findCommentAuthorProfileUseCase(userId)
}

export async function findCommentAuthorProfiles(
  userIds: string[]
): Promise<CommentAuthorProfiles> {
  return findCommentAuthorProfilesUseCase(userIds)
}

export async function findCommentForDelete(
  commentId: string
): Promise<CommentForDelete> {
  return findCommentForDeleteUseCase(commentId)
}

export async function findCommentLikesByCommentIds(
  commentIds: string[]
): Promise<CommentLikeRows> {
  return findCommentLikesByCommentIdsUseCase(commentIds)
}

export async function findCommentsByPostId(
  postId: string
): Promise<CommentDataRow[]> {
  return findCommentsByPostIdUseCase(postId)
}

export async function findCreatorUser(
  creatorId: string
): Promise<CreatorUser> {
  return findCreatorUserUseCase(creatorId)
}

export async function findPostOwner(postId: string): Promise<PostOwner> {
  return findPostOwnerUseCase(postId)
}

export async function softDeleteComment(commentId: string): Promise<void> {
  return softDeleteCommentUseCase(commentId)
}
