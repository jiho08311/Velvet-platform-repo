export type DiscoveryCreatorLinkItem = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
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

export type DiscoveryPostIdentity = {
  postId: string
  creatorId: string
  creatorUserId: string
  creatorUsername: string
  creatorDisplayName: string | null
}

export type DiscoveryPostRenderState = {
  id: string
  imageUrl: string
  mediaType?: "image" | "video"
  mediaCount: number
  createdAt: string
  text: string | null
  media: DiscoveryPostMediaItem[]
  blocks: DiscoveryPostBlockItem[]
}

export type DiscoveryPostEngagementState = {
  likesCount: number
  commentsCount: number
  viewerHasLiked?: boolean
  isLiked?: boolean
}

export type DiscoveryPostLinkItem = DiscoveryPostIdentity &
  DiscoveryPostRenderState &
  DiscoveryPostEngagementState
