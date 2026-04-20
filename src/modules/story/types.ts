export type StoryVisibility = "public" | "subscribers"
export type StoryLockReason = "none" | "subscription"
export type StoryMediaType = "image" | "video"


/**
 * StoryReadStateMap
 * - Key: creatorId
 * - Value: lastSeenStoryId
 *
 * This shape MUST stay aligned with persisted contract.
 */


export type StoryTextOverlay = {
  id: string
  text: string
  x: number
  y: number
  color?: string
  fontSize?: "sm" | "md" | "lg"
  scale?: number
}

export type StoryOverlayItem = {
  id: string
  type: "sticker" | "badge"
  preset: string
  x: number
  y: number
  scale?: number
  rotation?: number
}

export type StoryFilter = {
  preset: "none" | "warm" | "cool" | "mono" | "vivid"
}

export type StoryMusicSource = "internal" | "external"

export type StoryMusic = {
  style?: "default" | "minimal" | "bold"
  source: StoryMusicSource
  assetId?: string
  trackId?: string
  title?: string
  artist?: string
  artworkUrl?: string | null
  previewUrl?: string | null
  startTime?: number
  duration?: number
  volume?: number
  x?: number
  y?: number
}

export type StoryEditorState = {
  textOverlays?: StoryTextOverlay[]
  overlays?: StoryOverlayItem[]
  filter?: StoryFilter | null
  music?: StoryMusic | null
}

export type StoryEditorTool =
  | "text"
  | "sticker"
  | "music"
  | "filter"
  | "trim"
  | null

export type StorySelectedLayer =
  | {
      type: "text"
      id: string
    }
  | {
      type: "overlay"
      id: string
    }
  | {
      type: "music"
      id: "music"
    }
  | null

export type StoryEditorUiState = {
  activeTool: StoryEditorTool
  selectedLayer: StorySelectedLayer
  isPreviewMode: boolean
  isDragging: boolean
  isToolSheetOpen: boolean
}

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
  editorState: StoryEditorState | null
  createdAt: string
  expiresAt: string
  isDeleted: boolean
  isLocked: boolean
  lockReason: StoryLockReason
  creator: StoryCreator | null
}

export type StoryMusicSearchItem = {
  trackId: string
  title: string
  artist: string
  artworkUrl?: string | null
  previewUrl?: string | null
  duration?: number | null
  source: "external"
}

export type StoryPublicState = "visible" | "not_visible"

export type StoryPublicStateInput = {
  now: string
  story: {
    isDeleted: boolean
    expiresAt: string | null
  }
  creator: {
    status: string | null | undefined
  } | null
  profile: {
    isDeactivated: boolean | null | undefined
    isDeletePending: boolean | null | undefined
    deletedAt: string | null | undefined
    isBanned: boolean | null | undefined
  } | null
}

export type StoryAccessState =
  | "not_visible"
  | "visible_locked"
  | "visible_unlocked"

export type StoryAccessStateInput = {
  visibility: StoryVisibility
  isOwner: boolean
  hasSubscriptionAccess: boolean
}
export type StorySurfaceItemInput = {
  id: string
  creatorId: string
  mediaUrl: string
  mediaType: StoryMediaType
  text: string | null
  visibility: StoryVisibility
  editorState: StoryEditorState | null
  createdAt: string
  expiresAt: string
  isDeleted: boolean
  accessState: StoryAccessState
  creator: StoryCreator | null
}
export type StoryReadStateMap = Record<string, string>

export type StoryReadResolution = {
  creatorId: string
  latestStoryId: string | null
  lastSeenStoryId: string | null
  hasUnseenStory: boolean
  isRead: boolean
}

export type StorySeenUpdateInput = {
  creatorId: string
  storyId: string
  lastMarkedStoryId: string | null
}

export type StorySeenUpdateResolution = {
  shouldMarkSeen: boolean
}