import {
  createPost as createPostInternal,
} from "@/modules/post/server/create-post"

export function createPost(
  input: Parameters<typeof createPostInternal>[0]
): ReturnType<typeof createPostInternal> {
  return createPostInternal(input)
}
