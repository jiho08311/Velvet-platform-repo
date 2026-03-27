export type FeedItemId = string

export type FeedItem = {
  id: FeedItemId
  postId: string
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  text: string
  createdAt: string
  isLocked: boolean
  lockReason?: "none" | "subscription" | "purchase"
  mediaThumbnailUrls?: string[]
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}