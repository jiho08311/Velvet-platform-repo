import type {
  CreatePostCarouselItem,
  CreatePostClientDraftBlock,
  CreatePostClientDraftMediaSource,
  CreatePostUploadedMediaInput,
  NormalizedPostEditorBlock,
  NormalizedPostEditorMediaSource,
  PostBlockEditorState,
  PostVisibility,
} from "@/modules/post/types"

export type PublishMode = "now" | "scheduled"

export type SubmitPostInput = {
  visibility: PostVisibility
  publishMode: PublishMode
  publishedAt: string | null
  blocks: CreatePostClientDraftBlock[]
  uploadedFiles: Record<string, File>
}

export type CreatePostFormProps = {
  isSubmitting?: boolean
  onSubmitPost: (input: SubmitPostInput) => void
  initialTextBlocks?: string[]
  initialVisibility?: PostVisibility
  initialBlocks?: NormalizedPostEditorBlock<CreatePostUploadedMediaInput>[]
  visibilityOptions?: PostVisibility[]
  showPublishMode?: boolean
  submitLabel?: string
  resetAfterSubmit?: boolean
}

export type CarouselEditorItem = {
  id: string
  type: CreatePostCarouselItem["type"]
  media: CreatePostClientDraftMediaSource
  file?: File
  previewUrl?: string
  editorState?: PostBlockEditorState
}

export type EditorTextBlock = Extract<
  CreatePostClientDraftBlock,
  { type: "text" }
> & {
  id: string
}

export type EditorMediaBlock = Extract<
  CreatePostClientDraftBlock,
  { type: "image" | "video" | "audio" | "file" }
> & {
  id: string
  file?: File
  previewUrl?: string
}

export type EditorCarouselBlock = {
  id: string
  type: "carousel"
  sortOrder: number
  items: CarouselEditorItem[]
  editorState?: null
  content?: null
}

export type EditorBlock =
  | EditorTextBlock
  | EditorMediaBlock
  | EditorCarouselBlock

export const FILTER_PRESETS = ["none", "warm", "cool", "mono", "vivid"] as const
export type PostFilterPreset = (typeof FILTER_PRESETS)[number]
export const FILTER_SWIPE_THRESHOLD = 40

export function createBlockId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createCarouselBlock(
  items: CarouselEditorItem[] = []
): EditorBlock {
  return {
    id: createBlockId(),
    type: "carousel",
    sortOrder: 0,
    items,
    editorState: null,
  }
}

export function createUploadedPlaceholderId(file: File) {
  return `create-upload:${file.name}:${file.size}:${file.lastModified}:${file.type}`
}

export function isAcceptedPostMediaFile(file: File) {
  return file.type.startsWith("image/") || file.type.startsWith("video/")
}

export function getAcceptedPostMediaFiles(fileList: FileList | null) {
  return Array.from(fileList ?? []).filter(isAcceptedPostMediaFile)
}

export function createUploadedMediaSource(
  file: File,
  type: CreatePostCarouselItem["type"]
): CreatePostClientDraftMediaSource {
  return {
    kind: "uploaded",
    uploaded: {
      placeholderId: createUploadedPlaceholderId(file),
      type,
      mimeType: file.type || "",
      size: file.size,
      originalName: file.name,
    },
  }
}

export function createClientUploadedMediaSourceFromDraft(
  uploaded: CreatePostUploadedMediaInput
): CreatePostClientDraftMediaSource {
  return {
    kind: "uploaded",
    uploaded: {
      ...uploaded,
      placeholderId: uploaded.path,
    },
  }
}

export function createClientDraftMediaSourceFromNormalizedSource(
  media: NormalizedPostEditorMediaSource<CreatePostUploadedMediaInput>
): CreatePostClientDraftMediaSource {
  if (media.kind === "existing") {
    return {
      kind: "existing",
      mediaId: media.mediaId,
    }
  }

  return createClientUploadedMediaSourceFromDraft(media.uploaded)
}

export function normalizeEditorBlocks(blocks: EditorBlock[]): EditorBlock[] {
  return blocks.map((block, index) => ({
    ...block,
    sortOrder: index,
  }))
}

export function createEditorTextBlockFromDraft(
  block: Extract<
    NormalizedPostEditorBlock<CreatePostUploadedMediaInput>,
    { type: "text" }
  >
): EditorTextBlock {
  return {
    id: createBlockId(),
    type: "text",
    sortOrder: block.sortOrder,
    content: block.content ?? "",
    editorState: block.editorState ?? null,
  }
}

export function createEditorCarouselItemFromDraft(
  item: CreatePostCarouselItem
): CarouselEditorItem {
  return {
    id: createBlockId(),
    type: item.type,
    previewUrl: undefined,
    media: createClientDraftMediaSourceFromNormalizedSource(item.media),
    file: undefined,
    editorState: item.editorState ?? null,
  }
}

export function createEditorMediaBlockFromDraft(
  block: Extract<
    NormalizedPostEditorBlock<CreatePostUploadedMediaInput>,
    { type: "image" | "video" | "audio" | "file" }
  >
): EditorMediaBlock {
  return {
    id: createBlockId(),
    type: block.type,
    sortOrder: block.sortOrder,
    previewUrl: undefined,
    media: createClientDraftMediaSourceFromNormalizedSource(block.media),
    file: undefined,
    editorState: block.editorState ?? null,
    content: null,
  }
}

export function createEditorBlockFromNormalizedDraft(
  block: NormalizedPostEditorBlock<CreatePostUploadedMediaInput>
): EditorBlock {
  if (block.type === "text") {
    return createEditorTextBlockFromDraft(block)
  }

  if (block.type === "carousel") {
    return {
      id: createBlockId(),
      type: "carousel",
      sortOrder: block.sortOrder,
      items: block.items.map(createEditorCarouselItemFromDraft),
      editorState: null,
    }
  }

  return createEditorMediaBlockFromDraft(block)
}

export function createInitialEditorBlocks(params: {
  initialBlocks?: NormalizedPostEditorBlock<CreatePostUploadedMediaInput>[]
  initialTextBlocks?: string[]
}): EditorBlock[] {
  if (params.initialBlocks && params.initialBlocks.length > 0) {
    return normalizeEditorBlocks(
      params.initialBlocks.map(createEditorBlockFromNormalizedDraft)
    )
  }

  return normalizeEditorBlocks(
    (params.initialTextBlocks ?? [""]).map(
      (content): EditorBlock => ({
        id: createBlockId(),
        type: "text",
        sortOrder: 0,
        content,
        editorState: undefined,
      })
    )
  )
}

export function createSerializedUploadedMediaSource(params: {
  placeholderId: string
  type: CreatePostCarouselItem["type"]
  file: File
}): CreatePostClientDraftMediaSource {
  return {
    kind: "uploaded",
    uploaded: {
      placeholderId: params.placeholderId,
      type: params.type,
      mimeType: params.file.type || "",
      size: params.file.size,
      originalName: params.file.name,
    },
  }
}

export function clampPosition(value: number) {
  return Math.min(0.98, Math.max(0.02, value))
}

export function clampScale(value: number) {
  return Math.min(6, Math.max(0.8, value))
}

export function getTouchDistance(
  touchA: { clientX: number; clientY: number },
  touchB: { clientX: number; clientY: number }
) {
  const dx = touchA.clientX - touchB.clientX
  const dy = touchA.clientY - touchB.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

export function createDefaultImageEditorState(): PostBlockEditorState {
  return {
    image: {
      filter: "none",
      overlayText: null,
    },
  }
}

export function createDefaultVideoEditorState(): PostBlockEditorState {
  return {
    video: {
      trimStart: 0,
      trimEnd: null,
      muted: true,
    },
  }
}

export function getFilterStyle(filter?: string) {
  switch (filter) {
    case "warm":
      return { filter: "sepia(0.3) saturate(1.2)" }
    case "cool":
      return { filter: "hue-rotate(180deg) saturate(1.1)" }
    case "mono":
      return { filter: "grayscale(1)" }
    case "vivid":
      return { filter: "contrast(1.2) saturate(1.4)" }
    default:
      return { filter: "none" }
  }
}
