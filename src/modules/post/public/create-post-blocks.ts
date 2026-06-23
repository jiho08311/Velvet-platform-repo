import {
  createPostBlocks as createPostBlocksInternal,
} from "@/modules/post/runtime/create-post-blocks"

export const PUBLIC_CONTRACT = true

export type CreatePostBlocksInput = Parameters<typeof createPostBlocksInternal>

export function createPostBlocks(
  ...args: CreatePostBlocksInput
): ReturnType<typeof createPostBlocksInternal> {
  return createPostBlocksInternal(...args)
}
