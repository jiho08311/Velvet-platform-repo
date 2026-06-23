import type {
  CreatePostPersistedBlockRowInput,
  PostBlockEditorState,
  PostBlockType,
  PostStatus,
  PostVisibility,
} from "./post-core-types"
import type {
  CreatePostDraftBlock,
  CreatePostUploadedMediaInput,
} from "./post-editor-types"

export type CreatePostDraftInput = {
  creatorId: string
  title?: string | null
  visibility: PostVisibility
  price?: number
  status?: PostStatus
  publishedAt?: string | null
  blocks: CreatePostDraftBlock[]
}

export type CreatePostDraftStatus = Extract<
  PostStatus,
  "draft" | "scheduled" | "published"
>

export type NormalizedCreatePostDraftIntent = {
  creatorId: string
  title?: string | null
  visibility: PostVisibility
  price: number
  status: CreatePostDraftStatus
  publishedAt: string | null
  blocks: CreatePostDraftBlock[]
}

export type CreatePostDraftProjectionKey = string

export type CreatePostPersistenceCoordinates = {
  blockSortOrder: number
  mediaSortOrder: number | null
  carouselGroupId: string | null
  carouselItemIndex: number | null
}

export type CreatePostAuthoringMediaRowInput = {
  projectionKey: CreatePostDraftProjectionKey
  type: Exclude<PostBlockType, "text">
  sortOrder: number
  uploaded: CreatePostUploadedMediaInput
  editorState?: PostBlockEditorState
  coordinates: CreatePostPersistenceCoordinates
}

export type CreatePostUploadedMediaPersistencePlanItem =
  CreatePostAuthoringMediaRowInput

export type CreatePostUploadedMediaBinding =
  CreatePostUploadedMediaPersistencePlanItem

export type CreatePostMediaCreationPlanItem =
  CreatePostUploadedMediaPersistencePlanItem

export type CreatePostPersistedMediaMappingItem = {
  projectionKey: CreatePostDraftProjectionKey
  mediaId: string
  type: Exclude<PostBlockType, "text" | "carousel">
  storagePath: string
}

export type CreatePostResolvedMediaItem = {
  id: string
  type: Exclude<PostBlockType, "text" | "carousel">
  storagePath: string
}

export type CreatePostBlockPersistenceMediaTarget =
  | {
      kind: "none"
    }
  | {
      kind: "existing"
      mediaId: string
    }
  | {
      kind: "uploaded"
      binding: CreatePostUploadedMediaBinding
    }

export type CreatePostBlockPersistencePlanItem = {
  kind: "text" | "existing-media" | "uploaded-media"
  block: CreatePostPersistedBlockRowInput
  media: CreatePostBlockPersistenceMediaTarget
  coordinates: CreatePostPersistenceCoordinates
}

export type CreatePostDraftProjection = {
  content: string | null
  blocksToPersist: CreatePostBlockPersistencePlanItem[]
  mediaToCreate: CreatePostMediaCreationPlanItem[]
}

export type CreatePostResolvedPersistencePlan = {
  blocksToInsert: CreatePostPersistedBlockRowInput[]
  persistedMedia: CreatePostPersistedMediaMappingItem[]
  resolvedMedia: CreatePostResolvedMediaItem[]
}
