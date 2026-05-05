// src/modules/post/public/update-post-row.ts

import {
  updatePost as updatePostInternal,
} from "@/modules/post/server/update-post"

export function updatePost(
  input: Parameters<typeof updatePostInternal>[0]
): ReturnType<typeof updatePostInternal> {
  return updatePostInternal(input)
}