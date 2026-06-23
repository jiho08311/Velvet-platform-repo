export function canDeleteComment(input: {
  currentUserId: string | null
  commentUserId: string
}) {
  return input.currentUserId !== null && input.currentUserId === input.commentUserId
}