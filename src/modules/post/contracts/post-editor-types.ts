import type {
  PostBlockEditorState,
  PostBlockType,
} from "./post-core-types"

export type CreatePostUploadedMediaInput = {
  path: string
  type: Exclude<PostBlockType, "text" | "carousel">
  mimeType: string
  size: number
  originalName: string
}

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

export type PostEditorDraftMediaSource<TUploadedMedia> =
  NormalizedPostEditorMediaSource<TUploadedMedia>

export type PostEditorCarouselItem<TUploadedMedia> =
  NormalizedPostEditorCarouselItem<TUploadedMedia>

export type PostEditorDraftBlock<TUploadedMedia> =
  NormalizedPostEditorBlock<TUploadedMedia>

export type NormalizedPostEditorInput<TUploadedMedia> = {
  blocks: NormalizedPostEditorBlock<TUploadedMedia>[]
}

export type PostEditorFormInputBlock<TUploadedMedia> =
  NormalizedPostEditorBlock<TUploadedMedia>

export type PostEditorFormInput<TUploadedMedia> =
  NormalizedPostEditorInput<TUploadedMedia>

export type CreatePostClientDraftMediaSource =
  NormalizedPostEditorMediaSource<CreatePostClientUploadedMediaPlaceholder>

export type CreatePostClientCarouselItem =
  NormalizedPostEditorCarouselItem<CreatePostClientUploadedMediaPlaceholder>

export type CreatePostClientDraftBlock =
  NormalizedPostEditorBlock<CreatePostClientUploadedMediaPlaceholder>

export type CreatePostCarouselMediaSource =
  NormalizedPostEditorMediaSource<CreatePostUploadedMediaInput>

export type CreatePostCarouselItem =
  NormalizedPostEditorCarouselItem<CreatePostUploadedMediaInput>

export type CreatePostDraftMediaSource =
  NormalizedPostEditorMediaSource<CreatePostUploadedMediaInput>

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
