import {
  executeCommentLike as executeCommentLikeRuntime,
  executeCommentUnlike as executeCommentUnlikeRuntime,
  executeCreatePostComment as executeCreatePostCommentRuntime,
  executePostLike as executePostLikeRuntime,
  executePostUnlike as executePostUnlikeRuntime,
} from "@/modules/post/runtime/execute-post-interaction-runtime"

export const PUBLIC_CONTRACT = true

export type ExecutePostLikeInput = Parameters<typeof executePostLikeRuntime>[0]
export type ExecutePostUnlikeInput = Parameters<typeof executePostUnlikeRuntime>[0]
export type ExecuteCommentLikeInput = Parameters<typeof executeCommentLikeRuntime>[0]
export type ExecuteCommentUnlikeInput = Parameters<
  typeof executeCommentUnlikeRuntime
>[0]
export type ExecuteCreatePostCommentInput = Parameters<
  typeof executeCreatePostCommentRuntime
>[0]

export type PostInteractionResult = Awaited<
  ReturnType<typeof executePostLikeRuntime>
>
export type CreatePostCommentResult = Awaited<
  ReturnType<typeof executeCreatePostCommentRuntime>
>

export async function executePostLike(
  input: ExecutePostLikeInput
): Promise<PostInteractionResult> {
  return executePostLikeRuntime(input)
}

export async function executePostUnlike(
  input: ExecutePostUnlikeInput
): Promise<PostInteractionResult> {
  return executePostUnlikeRuntime(input)
}

export async function executeCommentLike(
  input: ExecuteCommentLikeInput
): Promise<PostInteractionResult> {
  return executeCommentLikeRuntime(input)
}

export async function executeCommentUnlike(
  input: ExecuteCommentUnlikeInput
): Promise<PostInteractionResult> {
  return executeCommentUnlikeRuntime(input)
}

export async function executeCreatePostComment(
  input: ExecuteCreatePostCommentInput
): Promise<CreatePostCommentResult> {
  return executeCreatePostCommentRuntime(input)
}
