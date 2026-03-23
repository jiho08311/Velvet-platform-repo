export type MyPostListItem = {
  id: string
  creatorId: string
  text: string
  status: "draft" | "published"
  visibility: "public" | "subscribers" | "paid"
  isLocked: boolean
  createdAt: string
  publishedAt: string | null
}

export type GetMyPostsInput = {
  creatorId: string
  limit?: number
  cursor?: string | null
  status?: "draft" | "published"
}

export type GetMyPostsResult = {
  items: MyPostListItem[]
  nextCursor: string | null
}

export async function getMyPosts(
  input: GetMyPostsInput
): Promise<GetMyPostsResult> {
  const creatorId = input.creatorId.trim()

  if (!creatorId) {
    throw new Error("Creator id is required")
  }

  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))

  return {
    items: [],
    nextCursor: input.cursor ?? null,
  }
}