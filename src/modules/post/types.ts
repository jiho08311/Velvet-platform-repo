export type PostStatus = "draft" | "scheduled" | "published" | "archived"

export type PostVisibility =
  | "public"
  | "subscribers"
  | "paid"

export type PostAccessLockReason =
  | "none"
  | "subscription"
  | "purchase"

export type PostPurchaseBlockingReason =
  | "not_paid_post"
  | "invalid_price"
  | "owner"
  | "already_purchased"
  | "subscribed"

export type PostPurchaseEligibility =
  | {
      canPurchase: true
      blockingReason: null
    }
  | {
      canPurchase: false
      blockingReason: PostPurchaseBlockingReason
    }

export type PostLockedPreviewVariant = Exclude<
  PostAccessLockReason,
  "none"
>

export type PostAccessResult = {
  canView: boolean
  locked: boolean
  lockReason: PostAccessLockReason
}

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
 * Post authoring block row contract that is already normalized for persistence.
 * Persistence surfaces should prefer this name over generic draft-oriented names.
 */
export type CreatePostPersistedBlockRowInput = CreatePostBlockInput

/**
 * Persisted post block shape used when rebuilding editor draft state
 * from saved post_blocks rows.
 */
export type PersistedPostEditorBlockInput = {
  type: Exclude<PostBlockType, "carousel">
  content?: string | null
  sortOrder: number
  mediaId?: string | null
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

/**
 * Client-only placeholder identity for media selected during create flow
 * before it is uploaded and replaced with a storage path.
 */
export type CreatePostClientUploadedMediaPlaceholder = {
  placeholderId: string
  type: Exclude<PostBlockType, "text" | "carousel">
  mimeType: string
  size: number
  originalName: string
}

export type PostEditorMediaType = Exclude<PostBlockType, "text" | "carousel">

export type ExistingPostEditorMediaSource = {
  kind: "existing"
  mediaId: string
}

export type UploadedPostEditorMediaSource<TUploadedMedia> = {
  kind: "uploaded"
  uploaded: TUploadedMedia
}

/**
 * Normalized editor-time media source contract.
 * This is the source of truth for both create and edit drafts.
 * Existing media identity is represented only by mediaId and new media
 * is represented only by the uploaded payload shape.
 */
export type NormalizedPostEditorMediaSource<TUploadedMedia> =
  | UploadedPostEditorMediaSource<TUploadedMedia>
  | ExistingPostEditorMediaSource

export type NormalizedPostEditorCarouselItem<TUploadedMedia> = {
  type: PostEditorMediaType
  media: NormalizedPostEditorMediaSource<TUploadedMedia>
  editorState?: PostBlockEditorState
}

export type NormalizedPostEditorBlock<TUploadedMedia> =
  | {
      type: "text"
      sortOrder: number
      content: string
      editorState?: PostBlockEditorState
    }
  | {
      type: PostEditorMediaType
      sortOrder: number
      media: NormalizedPostEditorMediaSource<TUploadedMedia>
      editorState?: PostBlockEditorState
      content?: null
    }
  | {
      type: "carousel"
      sortOrder: number
      items: NormalizedPostEditorCarouselItem<TUploadedMedia>[]
      editorState?: null
      content?: null
    }

/**
 * Backward-compatible alias for existing editor draft references.
 */
export type PostEditorDraftMediaSource<TUploadedMedia> =
  NormalizedPostEditorMediaSource<TUploadedMedia>

/**
 * Backward-compatible alias for existing editor draft references.
 */
export type PostEditorCarouselItem<TUploadedMedia> =
  NormalizedPostEditorCarouselItem<TUploadedMedia>

/**
 * Backward-compatible alias for existing editor draft references.
 */
export type PostEditorDraftBlock<TUploadedMedia> =
  NormalizedPostEditorBlock<TUploadedMedia>

export type NormalizedPostEditorInput<TUploadedMedia> = {
  blocks: NormalizedPostEditorBlock<TUploadedMedia>[]
}

/**
 * Reusable editor form block contract shared by create and edit surfaces.
 * UI surfaces should prefer this normalized editor block shape when they are
 * not tied to create-only persistence semantics.
 */
export type PostEditorFormInputBlock<TUploadedMedia> =
  NormalizedPostEditorBlock<TUploadedMedia>

export type PostEditorFormInput<TUploadedMedia> =
  NormalizedPostEditorInput<TUploadedMedia>

export type CreatePostClientDraftMediaSource =
  NormalizedPostEditorMediaSource<CreatePostClientUploadedMediaPlaceholder>

export type CreatePostClientCarouselItem =
  NormalizedPostEditorCarouselItem<CreatePostClientUploadedMediaPlaceholder>

/**
 * Client create draft source of truth before upload replacement.
 * Uploaded media is identified by placeholderId, not storage path.
 */
export type CreatePostClientDraftBlock =
  NormalizedPostEditorBlock<CreatePostClientUploadedMediaPlaceholder>

export type CreatePostCarouselMediaSource =
  NormalizedPostEditorMediaSource<CreatePostUploadedMediaInput>

export type CreatePostCarouselItem =
  NormalizedPostEditorCarouselItem<CreatePostUploadedMediaInput>

/**
 * Create-time media source for a draft block.
 * - uploaded: brand new media uploaded during create flow
 * - existing: persisted media already identified by mediaId
 */
export type CreatePostDraftMediaSource =
  NormalizedPostEditorMediaSource<CreatePostUploadedMediaInput>

/**
 * Create-time draft block source of truth.
 * This should represent the full create draft before persistence projection.
 */
export type CreatePostDraftBlock =
  NormalizedPostEditorBlock<CreatePostUploadedMediaInput>

export type CreateOrEditPostFormBlock =
  PostEditorFormInputBlock<CreatePostUploadedMediaInput>

export type CreateOrEditPostFormInput =
  PostEditorFormInput<CreatePostUploadedMediaInput>

export type EditPostRemovedMediaDiff = {
  removedExistingMediaIds: string[]
}

export type EditPostUploadedMediaDiffItem = {
  type: Exclude<PostBlockType, "text" | "carousel">
  sortOrder: number
  uploaded: CreatePostUploadedMediaInput
  editorState?: PostBlockEditorState
}

export type PostEditModerationReentryInput = {
  currentContent: string | null
  nextContent: string | null
  currentBlockFingerprint: string
  nextBlockFingerprint: string
  hasNewMedia: boolean
  hasRemovedMedia: boolean
}

export type EditPostMediaDiff = EditPostRemovedMediaDiff & {
  existingMediaIds: string[]
  uploadedMedia: EditPostUploadedMediaDiffItem[]
  hasNewMedia: boolean
  hasRemovedMedia: boolean
}

export type NormalizedEditPostUpdateDraft = {
  blocks: CreateOrEditPostFormBlock[]
  content: string | null
  blockFingerprint: string
  media: EditPostMediaDiff
  comparison: PostEditModerationReentryInput
  isStructuralEqualToCurrent: boolean
  isRemoveOnlyMutation: boolean
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

/**
 * Allowed create-time lifecycle states for new posts.
 * Archived remains a persisted post state, but is not a valid create intent.
 */
export type CreatePostDraftStatus = Extract<
  PostStatus,
  "draft" | "scheduled" | "published"
>

/**
 * Server-side normalized create intent passed from create entrypoints
 * into the create workflow.
 *
 * This is the source of truth for create-time semantics before
 * draft projection and persistence.
 */
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

/**
 * Shared create-time persistence coordinates derived from the draft projection.
 * These coordinates are the source of truth for both post_blocks.sort_order and
 * media.sort_order derivation.
 */
export type CreatePostPersistenceCoordinates = {
  blockSortOrder: number
  mediaSortOrder: number | null
  carouselGroupId: string | null
  carouselItemIndex: number | null
}

/**
 * Post authoring media row contract for persistence creation.
 * This is the authoritative normalized mapping item for uploaded media
 * before it becomes a persisted media row.
 */
export type CreatePostAuthoringMediaRowInput = {
  projectionKey: CreatePostDraftProjectionKey
  type: Exclude<PostBlockType, "text">
  sortOrder: number
  uploaded: CreatePostUploadedMediaInput
  editorState?: PostBlockEditorState
  coordinates: CreatePostPersistenceCoordinates
}

/**
 * Projection-defined uploaded media persistence contract.
 * This is the authoritative linkage record shared by:
 * - the block persistence projection
 * - the media creation plan consumed by the workflow
 */
export type CreatePostUploadedMediaPersistencePlanItem =
  CreatePostAuthoringMediaRowInput

export type CreatePostUploadedMediaBinding =
  CreatePostUploadedMediaPersistencePlanItem

export type CreatePostMediaCreationPlanItem =
  CreatePostUploadedMediaPersistencePlanItem

/**
 * Persisted uploaded media mapping returned from workflow media creation.
 * The projection key remains attached so projection-defined linkage can be
 * resolved without positional or index-based reconstruction in the workflow.
 */
export type CreatePostPersistedMediaMappingItem = {
  projectionKey: CreatePostDraftProjectionKey
  mediaId: string
  type: Exclude<PostBlockType, "text" | "carousel">
  storagePath: string
}

/**
 * Projection-resolved persisted media output consumed by downstream handoff
 * surfaces such as moderation and workflow return values.
 */
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

/**
 * Projection-defined block persistence item.
 * Each block carries its own persistence coordinates and explicit media
 * linkage contract, so downstream workflow code does not need to reconstruct
 * block-to-media mapping rules.
 */
export type CreatePostBlockPersistencePlanItem = {
  kind: "text" | "existing-media" | "uploaded-media"
  block: CreatePostPersistedBlockRowInput
  media: CreatePostBlockPersistenceMediaTarget
  coordinates: CreatePostPersistenceCoordinates
}

/**
 * Persistence-ready create mapping for post authoring.
 * This is the source of truth that downstream persistence surfaces align to.
 */
export type CreatePostDraftProjection = {
  content: string | null
  blocksToPersist: CreatePostBlockPersistencePlanItem[]
  mediaToCreate: CreatePostMediaCreationPlanItem[]
}

/**
 * Final persistence consumption derived from the authoritative projection
 * and the persisted uploaded-media mapping produced by the workflow.
 */
export type CreatePostResolvedPersistencePlan = {
  blocksToInsert: CreatePostPersistedBlockRowInput[]
  persistedMedia: CreatePostPersistedMediaMappingItem[]
  resolvedMedia: CreatePostResolvedMediaItem[]
}

/**
 * Post row contract for persistence creation.
 * This is the normalized input consumed by createPost persistence.
 */
export type CreatePostPersistedRowInput = {
  creatorId: string
  title?: string | null
  content?: string | null
  status?: PostStatus
  visibility?: PostVisibility
  price?: number
  publishedAt?: string | null
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

export type PostRenderMediaEntry = {
  media: PostRenderMediaItem
  block?: PostBlock
}

export type PostNormalizedRenderTextGroup = {
  type: "text"
  block: PostBlock
}

export type PostNormalizedRenderMediaGroup = {
  type: "media"
  variant: "single" | "carousel"
  blocks: PostBlock[]
  mediaEntries: PostRenderMediaEntry[]
}

export type PostNormalizedRenderGroup =
  | PostNormalizedRenderTextGroup
  | PostNormalizedRenderMediaGroup

export type PostRenderInput = {
  hasBlocks: boolean
  resolvedMedia: PostRenderMediaItem[]
  normalizedGroups: PostNormalizedRenderGroup[]
  blockText: string
  blockMedia: PostRenderMediaItem[]
  resolvedMediaEntries: PostRenderMediaEntry[]
  lockedPreviewText: string
  primaryLockedPreviewMedia: PostRenderMediaItem | null
}

export type PostRenderSurfaceItem = {
  id: string
  creatorId: string
  content: string | null
  createdAt: string
  renderInput?: PostRenderInput
  media: Array<{
    id?: string
    url: string
    type: PostEditorMediaType
    mimeType?: string | null
    sortOrder?: number
  }>
  blocks: PostBlock[]
  price: number
  isLocked: boolean
  lockReason?: PostAccessLockReason
  purchaseEligibility?: PostPurchaseEligibility
  isLiked: boolean
  likesCount: number
  commentsCount: number
  visibility: PostVisibility
  status: PostStatus
  publishedAt: string | null
}

export type PostRenderListItem = {
  id: string
  creatorId: string
  content: string | null
  status: PostStatus
  visibility: PostVisibility
  price: number
  isLocked: boolean
  lockReason?: PostAccessLockReason
  purchaseEligibility?: PostPurchaseEligibility
  createdAt: string
  publishedAt: string | null
  media: Array<{
    id?: string
    url: string
    type: PostEditorMediaType
    mimeType?: string | null
    sortOrder?: number
  }>
}
