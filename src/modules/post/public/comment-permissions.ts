import {
  canDeleteComment as canDeleteCommentInternal,
} from "@/modules/post/policies/comment-permissions"

export const PUBLIC_CONTRACT = true

export type CanDeleteCommentInput = Parameters<typeof canDeleteCommentInternal>[0]

export function canDeleteComment(input: CanDeleteCommentInput): boolean {
  return canDeleteCommentInternal(input)
}
