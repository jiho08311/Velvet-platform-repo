import {
  countCommentLikes as countCommentLikesUseCase,
  createCommentLike as createCommentLikeUseCase,
  deleteCommentLike as deleteCommentLikeUseCase,
  findCommentOwnerForNotification as findCommentOwnerForNotificationUseCase,
} from "@/modules/post/use-cases/comment-like"

export const PUBLIC_CONTRACT = true

export type CreateCommentLikeInput = Parameters<typeof createCommentLikeUseCase>[0]
export type DeleteCommentLikeInput = Parameters<typeof deleteCommentLikeUseCase>[0]
export type CommentOwnerForNotification = Awaited<
  ReturnType<typeof findCommentOwnerForNotificationUseCase>
>

export async function countCommentLikes(
  commentId: string
): ReturnType<typeof countCommentLikesUseCase> {
  return countCommentLikesUseCase(commentId)
}

export async function createCommentLike(
  input: CreateCommentLikeInput
): Promise<void> {
  return createCommentLikeUseCase(input)
}

export async function deleteCommentLike(
  input: DeleteCommentLikeInput
): Promise<void> {
  return deleteCommentLikeUseCase(input)
}

export async function findCommentOwnerForNotification(
  commentId: string
): Promise<CommentOwnerForNotification> {
  return findCommentOwnerForNotificationUseCase(commentId)
}
