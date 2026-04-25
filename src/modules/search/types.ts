export type DiscoveryCreatorLinkItem = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export type CreatorSearchResult = {
  id: DiscoveryCreatorLinkItem["id"]
  username: DiscoveryCreatorLinkItem["username"]
  displayName: DiscoveryCreatorLinkItem["displayName"]
  avatarUrl: DiscoveryCreatorLinkItem["avatarUrl"]
  bio: string | null
  isVerified: boolean
}

export type CreatorSearchConnection = {
  items: CreatorSearchResult[]
  nextCursor: string | null
}

export type CreatorSearchResponse = {
  creators: CreatorSearchConnection["items"]
  nextCursor: CreatorSearchConnection["nextCursor"]
}

export type DiscoveryPostMediaItem = {
  id: string
  postId: string
  type: "image" | "video" | "audio" | "file"
  url: string
  mimeType: string | null
  sortOrder: number
}

export type DiscoveryPostBlockItem = {
  id: string
  postId: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  mediaId: string | null
  sortOrder: number
  createdAt: string
  editorState: unknown | null
}

export type DiscoveryPostLinkItem = {
  id: string
  postId: string
  creatorId: string
  creatorUserId: string
  creatorUsername: string
  creatorDisplayName: string | null
  imageUrl: string
  mediaType?: "image" | "video"
  mediaCount: number
  createdAt: string
  text: string | null
  likesCount: number
  commentsCount: number
  media: DiscoveryPostMediaItem[]
  blocks: DiscoveryPostBlockItem[]
}
