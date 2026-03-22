export type CreatorSubscriber = {
  subscriptionId: string
  viewerUserId: string
  username: string
  displayName: string
  avatarUrl: string | null
  subscribedAt: string
}

export type GetCreatorSubscribersInput = {
  creatorId: string
  status?: "active"
  limit?: number
  cursor?: string | null
}

export type GetCreatorSubscribersResult = {
  items: CreatorSubscriber[]
  nextCursor: string | null
}

export async function getCreatorSubscribers(
  input: GetCreatorSubscribersInput
): Promise<GetCreatorSubscribersResult> {
  const creatorId = input.creatorId.trim()

  if (!creatorId) {
    throw new Error("Creator id is required")
  }

  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))

  return {
    items: [],
    nextCursor: input.cursor ? null : null,
  }
}