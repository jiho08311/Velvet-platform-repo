export type StoryVisibility = "public" | "subscribers"
export type StoryLockReason = "none" | "subscription"
export type StoryMediaType = "image" | "video"

export type StoryCreator = {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
}

export type Story = {
  id: string
  creatorId: string
  mediaUrl: string
  mediaType: StoryMediaType
  text: string | null
  visibility: StoryVisibility
  createdAt: string
  expiresAt: string
  isDeleted: boolean
  isLocked: boolean
  lockReason: StoryLockReason
  creator: StoryCreator | null
}