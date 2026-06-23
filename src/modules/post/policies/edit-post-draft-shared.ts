import type {
  CreateOrEditPostFormBlock,
  CreateOrEditPostFormInput,
  CreatePostUploadedMediaInput,
  PostBlockEditorState,
  PostEditorCarouselItem,
  PostEditorDraftMediaSource,
} from "../types"

export type EditPostDraftMediaSource =
  PostEditorDraftMediaSource<CreatePostUploadedMediaInput>

export type EditPostDraftCarouselItem =
  PostEditorCarouselItem<CreatePostUploadedMediaInput>

export type EditPostDraftBlock = CreateOrEditPostFormBlock

export type EditPostDraft = CreateOrEditPostFormInput

export type UploadedEditDraftMedia = {
  type: "image" | "video" | "audio" | "file"
  sortOrder: number
  uploaded: CreatePostUploadedMediaInput
  editorState?: PostBlockEditorState
}

export function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

export function sortBySortOrder<T extends { sortOrder: number }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder)
}

export function buildTextDraftBlock(params: {
  content: string | null | undefined
  sortOrder: number
  editorState?: PostBlockEditorState
}): EditPostDraftBlock | null {
  const content = normalizeText(params.content)

  if (!content) {
    return null
  }

  return {
    type: "text",
    content,
    sortOrder: params.sortOrder,
    editorState: params.editorState ?? null,
  }
}

export function isNonEmptyTextBlock(
  block: EditPostDraftBlock
): block is Extract<EditPostDraftBlock, { type: "text" }> {
  return block.type === "text" && normalizeText(block.content).length > 0
}

export function isExistingMediaBlock(
  block: EditPostDraftBlock
): block is Extract<
  EditPostDraftBlock,
  { type: "image" | "video" | "audio" | "file" }
> & {
  media: { kind: "existing"; mediaId: string }
} {
  return (
    block.type !== "text" &&
    block.type !== "carousel" &&
    block.media.kind === "existing"
  )
}

export function isUploadedMediaBlock(
  block: EditPostDraftBlock
): block is Extract<
  EditPostDraftBlock,
  { type: "image" | "video" | "audio" | "file" }
> & {
  media: { kind: "uploaded"; uploaded: CreatePostUploadedMediaInput }
} {
  return (
    block.type !== "text" &&
    block.type !== "carousel" &&
    block.media.kind === "uploaded"
  )
}
