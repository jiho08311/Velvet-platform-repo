import {
  createPostBlocks as createPostBlocksInternal,
} from "@/modules/post/server/create-post-blocks"

export function createPostBlocks(
  ...args: Parameters<typeof createPostBlocksInternal>
): ReturnType<typeof createPostBlocksInternal> {
  return createPostBlocksInternal(...args)
}
