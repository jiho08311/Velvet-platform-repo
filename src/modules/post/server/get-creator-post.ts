import type { Post } from "../types"

export type CreatorPostListItem = Post & {
  isLocked: boolean
}

export type GetCreatorPostsInput = {
  creatorId: string
  limit?: number
  cursor?: string | null
}

export type GetCreatorPostsResult = {
  items: CreatorPostListItem[]
  nextCursor: string | null
}

export async function getCreatorPosts(
  _input: GetCreatorPostsInput
): Promise<GetCreatorPostsResult> {
  return {
    items: [],
    nextCursor: null,
  }
}