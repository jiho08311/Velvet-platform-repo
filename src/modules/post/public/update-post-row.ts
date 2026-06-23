// src/modules/post/public/update-post-row.ts

import {
  updatePost as updatePostInternal,
} from "@/modules/post/runtime/update-post"

export const PUBLIC_CONTRACT = true

export type UpdatePostInput = Parameters<typeof updatePostInternal>[0]
export type UpdatePostResult = Awaited<ReturnType<typeof updatePostInternal>>

export function updatePost(
  input: UpdatePostInput
): ReturnType<typeof updatePostInternal> {
  return updatePostInternal(input)
}
