import {
  updatePostStatus as updatePostStatusInternal,
} from "@/modules/post/server/update-post-status"

export function updatePostStatus(
  input: Parameters<typeof updatePostStatusInternal>[0]
): ReturnType<typeof updatePostStatusInternal> {
  return updatePostStatusInternal(input)
}
