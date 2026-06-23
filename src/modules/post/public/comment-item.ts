import {
  createCommentItem as createCommentItemMapper,
  isCommentItem as isCommentItemMapper,
} from "@/modules/post/mappers/comment-item"

export const PUBLIC_CONTRACT = true

export type CreateCommentItemInput = Parameters<typeof createCommentItemMapper>[0]
export type CommentItem = ReturnType<typeof createCommentItemMapper>
export type CommentItemViewModel = CommentItem
export type CommentItemProfile = CommentItem["profiles"]
export type CommentRow = CreateCommentItemInput["comment"]

export function createCommentItem(input: CreateCommentItemInput): CommentItem {
  return createCommentItemMapper(input)
}

export function isCommentItem(value: unknown): value is CommentItem {
  return isCommentItemMapper(value)
}
