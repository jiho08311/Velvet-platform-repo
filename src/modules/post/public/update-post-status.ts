import {
  updatePostStatus as updatePostStatusInternal,
} from "@/modules/post/runtime/update-post-status"

export const PUBLIC_CONTRACT = true

export type UpdatePostStatusInput = Parameters<typeof updatePostStatusInternal>[0]

export function updatePostStatus(
  input: UpdatePostStatusInput
): ReturnType<typeof updatePostStatusInternal> {
  return updatePostStatusInternal(input)
}
