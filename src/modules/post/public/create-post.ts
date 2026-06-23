import {
  createPost as createPostInternal,
} from "@/modules/post/runtime/create-post"

export const PUBLIC_CONTRACT = true

export type CreatePostInput = Parameters<typeof createPostInternal>[0]
export type CreatePostResult = Awaited<ReturnType<typeof createPostInternal>>

export function createPost(
  input: CreatePostInput
): ReturnType<typeof createPostInternal> {
  return createPostInternal(input)
}
