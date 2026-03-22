import type { Post, PostCreatorId } from "../types" 

export type CreatorPostListItem = Post & {
  isLocked: boolean
}

export type GetCreatorPostsInput = {
  creatorId: PostCreatorId
  limit?: number
  cursor?: string | null
}

export type GetCreatorPostsResult = {
  items: CreatorPostListItem[]
  nextCursor: string | null
}

export async function getCreatorPosts(
  input: GetCreatorPostsInput
): Promise<GetCreatorPostsResult> {
  if (!input.creatorId) {
    throw new Error("Creator id is required")
  }

  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))

  return {
    items: [],
    nextCursor: input.cursor ? null : null,
  }
}