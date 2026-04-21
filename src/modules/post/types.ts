export type PostStatus = "draft" | "scheduled" | "published" | "archived"

export type PostVisibility =
  | "public"
  | "subscribers"
  | "paid"

export type PostBlockType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "carousel"

export type PostBlockImageOverlayText = {
  text: string
  x: number
  y: number
  color: string
  fontSize: "sm" | "md" | "lg"
  scale: number
}

export type PostImageBlockEditorState = {
  filter: "none" | "warm" | "cool" | "mono" | "vivid"
  overlayText: PostBlockImageOverlayText | null
}

export type PostVideoBlockEditorState = {
  trimStart: number
  trimEnd: number | null
  muted: boolean
}

export type PostBlockEditorState = {
  image?: PostImageBlockEditorState
  video?: PostVideoBlockEditorState
  carousel?: {
    groupId: string
    index: number
    size: number
  }
} | null

export type PostBlock = {
  id: string
  postId: string
  type: PostBlockType
  content: string | null
  mediaId: string | null
  sortOrder: number
  createdAt: string
  editorState: PostBlockEditorState
}

/**
 * Persisted post block input.
 * This shape is for rows that are ready to be inserted into post_blocks.
 */
export type CreatePostBlockInput = {
  type: PostBlockType
  content?: string | null
  mediaId?: string | null
  sortOrder: number
  editorState?: PostBlockEditorState
}

/**
 * Uploaded media metadata after client upload is complete.
 * This is still create-time data, not persisted media.
 */
export type CreatePostUploadedMediaInput = {
  path: string
  type: Exclude<PostBlockType, "text" | "carousel">
  mimeType: string
  size: number
  originalName: string
}

export type CreatePostCarouselMediaSource =
  | {
      kind: "uploaded"
      uploaded: CreatePostUploadedMediaInput
    }
  | {
      kind: "existing"
      mediaId: string
    }

export type CreatePostCarouselItem = {
  type: Exclude<PostBlockType, "text" | "carousel">
  media: CreatePostCarouselMediaSource
  editorState?: PostBlockEditorState
}

/**
 * Create-time media source for a draft block.
 * - uploaded: brand new media uploaded during create flow
 * - existing: persisted media already identified by mediaId
 */
export type CreatePostDraftMediaSource =
  | {
      kind: "uploaded"
      uploaded: CreatePostUploadedMediaInput
    }
  | {
      kind: "existing"
      mediaId: string
    }

/**
 * Create-time draft block source of truth.
 * This should represent the full create draft before persistence projection.
 */
export type CreatePostDraftBlock =
  | {
      type: "text"
      content: string
      sortOrder: number
      editorState?: PostBlockEditorState
    }
  | {
      type: Exclude<PostBlockType, "text" | "carousel">
      sortOrder: number
      media: CreatePostDraftMediaSource
      editorState?: PostBlockEditorState
      content?: null
    }
  | {
      type: "carousel"
      sortOrder: number
      items: CreatePostCarouselItem[]
      editorState?: null
      content?: null
    }

export type CreatePostDraftInput = {
  creatorId: string
  title?: string | null
  visibility: PostVisibility
  price?: number
  status?: PostStatus
  publishedAt?: string | null
  blocks: CreatePostDraftBlock[]
}

export type CreatePostPersistedMediaDraftItem = {
  type: Exclude<PostBlockType, "text">
  sortOrder: number
  uploaded: CreatePostUploadedMediaInput
  editorState?: PostBlockEditorState
}

export type CreatePostDraftProjection = {
  content: string | null
  media: CreatePostPersistedMediaDraftItem[]
  blocks: CreatePostBlockInput[]
}

export type Post = {
  id: string
  creatorId: string
  title: string | null
  content: string | null
  status: PostStatus
  visibility: PostVisibility
  price: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  blocks?: PostBlock[]
}

export type CreatePostInput = {
  creatorId: string
  title?: string | null
  content?: string | null
  status?: PostStatus
  visibility?: PostVisibility
  price?: number
  publishedAt?: string | null
  blocks?: CreatePostBlockInput[]
}

export type PostRenderMediaType = Exclude<PostBlockType, "text">

export type PostRenderMediaItem = {
  id?: string
  url: string
  type: PostRenderMediaType
  mimeType?: string | null
  sortOrder?: number
}

export type PostRenderTextGroup = {
  type: "text"
  block: PostBlock
}

export type PostRenderMediaEntry = {
  media: PostRenderMediaItem
  block?: PostBlock
}

export type PostRenderMediaGroup = {
  type: "media"
  blocks: PostBlock[]
  mediaItems: PostRenderMediaItem[]
  mediaEntries: PostRenderMediaEntry[]
}

export type PostRenderGroup =
  | PostRenderTextGroup
  | PostRenderMediaGroup