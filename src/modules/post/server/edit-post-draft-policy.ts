import type {
  CreateOrEditPostFormBlock,
  CreateOrEditPostFormInput,
  CreatePostClientDraftBlock,
  CreatePostUploadedMediaInput,
  EditPostMediaDiff,
  EditPostRemovedMediaDiff,
  EditPostUploadedMediaDiffItem,
  NormalizedEditPostUpdateDraft,
  PersistedPostEditorBlockInput,
  PostEditModerationReentryInput,
  PostEditorCarouselItem,
  PostEditorDraftMediaSource,
  PostBlockEditorState,
  PostBlockType,
} from "../types"
import { buildPostEditorDraftFromPersistedBlocks } from "./post-editor-draft-normalizer"

export type EditPostDraftMediaSource =
  PostEditorDraftMediaSource<CreatePostUploadedMediaInput>

export type EditPostDraftCarouselItem =
  PostEditorCarouselItem<CreatePostUploadedMediaInput>

export type EditPostDraftBlock = CreateOrEditPostFormBlock

export type EditPostDraft = CreateOrEditPostFormInput

export type EditPostModerationComparisonInput = PostEditModerationReentryInput

type NormalizeSubmittedEditDraftInput = {
  blocks: CreatePostClientDraftBlock[]
  uploadedFiles?: CreatePostUploadedMediaInput[]
}

type UploadedEditDraftMedia = {
  type: "image" | "video" | "audio" | "file"
  sortOrder: number
  uploaded: CreatePostUploadedMediaInput
  editorState?: PostBlockEditorState
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

function isMediaType(
  type: PostBlockType
): type is "image" | "video" | "audio" | "file" {
  return (
    type === "image" ||
    type === "video" ||
    type === "audio" ||
    type === "file"
  )
}

function sortBySortOrder<T extends { sortOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder)
}

function buildTextDraftBlock(params: {
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

function buildExistingMediaDraftSource(
  mediaId: string
): EditPostDraftMediaSource | null {
  const normalizedMediaId = mediaId.trim()

  if (!normalizedMediaId) {
    return null
  }

  return {
    kind: "existing",
    mediaId: normalizedMediaId,
  }
}

function buildExistingMediaDraftBlock(params: {
  type: "image" | "video" | "audio" | "file"
  mediaId: string
  sortOrder: number
  editorState?: PostBlockEditorState
}): EditPostDraftBlock | null {
  const media = buildExistingMediaDraftSource(params.mediaId)

  if (!media) {
    return null
  }

  return {
    type: params.type,
    sortOrder: params.sortOrder,
    media,
    editorState: params.editorState ?? null,
    content: null,
  }
}

function buildUploadedMediaDraftBlock(params: {
  type: "image" | "video" | "audio" | "file"
  uploaded: CreatePostUploadedMediaInput
  sortOrder: number
  editorState?: PostBlockEditorState
}): EditPostDraftBlock {
  return {
    type: params.type,
    sortOrder: params.sortOrder,
    media: {
      kind: "uploaded",
      uploaded: params.uploaded,
    },
    editorState: params.editorState ?? null,
    content: null,
  }
}

function buildExistingCarouselItem(params: {
  type: "image" | "video" | "audio" | "file"
  mediaId: string
  editorState?: PostBlockEditorState
}): EditPostDraftCarouselItem | null {
  const media = buildExistingMediaDraftSource(params.mediaId)

  if (!media) {
    return null
  }

  return {
    type: params.type,
    media,
    editorState: params.editorState ?? null,
  }
}

function buildUploadedCarouselItem(params: {
  type: "image" | "video" | "audio" | "file"
  uploaded: CreatePostUploadedMediaInput
  editorState?: PostBlockEditorState
}): EditPostDraftCarouselItem {
  return {
    type: params.type,
    media: {
      kind: "uploaded",
      uploaded: params.uploaded,
    },
    editorState: params.editorState ?? null,
  }
}

function isNonEmptyTextBlock(
  block: EditPostDraftBlock
): block is Extract<EditPostDraftBlock, { type: "text" }> {
  return block.type === "text" && normalizeText(block.content).length > 0
}

function isExistingMediaBlock(
  block: EditPostDraftBlock
): block is Extract<
  EditPostDraftBlock,
  { type: "image" | "video" | "audio" | "file" }
> & {
  media: { kind: "existing"; mediaId: string }
} {
  return block.type !== "text" && block.type !== "carousel" && block.media.kind === "existing"
}

function isUploadedMediaBlock(
  block: EditPostDraftBlock
): block is Extract<
  EditPostDraftBlock,
  { type: "image" | "video" | "audio" | "file" }
> & {
  media: { kind: "uploaded"; uploaded: CreatePostUploadedMediaInput }
} {
  return block.type !== "text" && block.type !== "carousel" && block.media.kind === "uploaded"
}

function flattenSubmittedMediaBlocksToDraft(input: NormalizeSubmittedEditDraftInput): EditPostDraftBlock[] {
  const sortedBlocks = sortBySortOrder(input.blocks)
  const uploadedFiles = input.uploadedFiles ?? []
  let uploadedFileIndex = 0

  return sortedBlocks.flatMap((block): EditPostDraftBlock[] => {
    if (block.type === "text") {
      const draftBlock = buildTextDraftBlock({
        content: block.content,
        sortOrder: block.sortOrder,
        editorState: block.editorState,
      })

      if (!draftBlock) {
        return []
      }

      return [draftBlock]
    }

    if (block.type === "carousel") {
      const items = block.items.flatMap((item): EditPostDraftCarouselItem[] => {
        if (item.media.kind === "existing") {
          const carouselItem = buildExistingCarouselItem({
            type: item.type,
            mediaId: item.media.mediaId,
            editorState: item.editorState,
          })

          return carouselItem ? [carouselItem] : []
        }

        const uploaded = uploadedFiles[uploadedFileIndex]

        if (!uploaded) {
          return []
        }

        uploadedFileIndex += 1

        return [
          buildUploadedCarouselItem({
            type: item.type,
            uploaded,
            editorState: item.editorState,
          }),
        ]
      })

      if (items.length === 0) {
        return []
      }

      return [
        {
          type: "carousel",
          sortOrder: block.sortOrder,
          items,
          editorState: null,
          content: null,
        },
      ]
    }

    if (!isMediaType(block.type)) {
      return []
    }

    if (block.media.kind === "existing") {
      const draftBlock = buildExistingMediaDraftBlock({
        type: block.type,
        mediaId: block.media.mediaId,
        sortOrder: block.sortOrder,
        editorState: block.editorState,
      })

      return draftBlock ? [draftBlock] : []
    }

    const uploaded = uploadedFiles[uploadedFileIndex]

    if (!uploaded) {
      return []
    }

    uploadedFileIndex += 1

    return [
      buildUploadedMediaDraftBlock({
        type: block.type,
        uploaded,
        sortOrder: block.sortOrder,
        editorState: block.editorState,
      }),
    ]
  })
}

/**
 * Persisted blocks -> normalized edit draft
 */
export function buildInitialEditPostDraft(params: {
  blocks: PersistedPostEditorBlockInput[]
}): EditPostDraft {
  return {
    blocks: buildPostEditorDraftFromPersistedBlocks(params.blocks),
  }
}

/**
 * Current submit shape(blocks + uploadedFiles) -> normalized edit draft
 */
export function buildSubmittedEditPostDraft(
  input: NormalizeSubmittedEditDraftInput
): EditPostDraft {
  return {
    blocks: flattenSubmittedMediaBlocksToDraft(input),
  }
}

export function deriveEditPostContentFromDraft(
  draft: Pick<EditPostDraft, "blocks">
): string | null {
  const content = draft.blocks
    .filter(isNonEmptyTextBlock)
    .map((block) => normalizeText(block.content))
    .join("\n\n")
    .trim()

  return content.length > 0 ? content : null
}

export function projectPersistedEditBlocksFromDraft(
  draft: Pick<EditPostDraft, "blocks">
): PersistedPostEditorBlockInput[] {
  let nextSortOrder = 0

  return sortBySortOrder(draft.blocks).flatMap((block): PersistedPostEditorBlockInput[] => {
      if (block.type === "text") {
        const draftBlock = buildTextDraftBlock({
          content: block.content,
          sortOrder: block.sortOrder,
          editorState: block.editorState,
        })

        if (!draftBlock) {
          return []
        }

        const currentSortOrder = nextSortOrder
        nextSortOrder += 1

        return [
          {
            type: "text",
            content: draftBlock.content,
            sortOrder: currentSortOrder,
            mediaId: null,
            editorState: draftBlock.editorState ?? null,
          },
        ]
      }

      if (block.type === "carousel") {
        return block.items.map((item) => {
          const currentSortOrder = nextSortOrder
          nextSortOrder += 1

          return {
            type: item.type,
            content: null,
            sortOrder: currentSortOrder,
            mediaId: item.media.kind === "existing" ? item.media.mediaId : null,
            editorState: item.editorState ?? null,
          }
        })
      }

      if (isExistingMediaBlock(block)) {
        const currentSortOrder = nextSortOrder
        nextSortOrder += 1

        return [
          {
            type: block.type,
            content: null,
            sortOrder: currentSortOrder,
            mediaId: block.media.mediaId,
            editorState: block.editorState ?? null,
          },
        ]
      }

      if (isUploadedMediaBlock(block)) {
        const currentSortOrder = nextSortOrder
        nextSortOrder += 1

        return [
          {
            type: block.type,
            content: null,
            sortOrder: currentSortOrder,
            mediaId: null,
            editorState: block.editorState ?? null,
          },
        ]
      }

      return []
    })
}

export function extractUploadedMediaFromEditDraft(
  draft: Pick<EditPostDraft, "blocks">
): UploadedEditDraftMedia[] {
  let nextSortOrder = 0

  return sortBySortOrder(draft.blocks).flatMap((block) => {
    if (block.type === "carousel") {
      return block.items.flatMap((item) => {
        if (item.media.kind !== "uploaded") {
          nextSortOrder += 1
          return []
        }

        const currentSortOrder = nextSortOrder
        nextSortOrder += 1

        return [
          {
            type: item.type,
            sortOrder: currentSortOrder,
            uploaded: item.media.uploaded,
            editorState: item.editorState ?? null,
          },
        ]
      })
    }

    if (isUploadedMediaBlock(block)) {
      const currentSortOrder = nextSortOrder
      nextSortOrder += 1

      return [
        {
          type: block.type,
          sortOrder: currentSortOrder,
          uploaded: block.media.uploaded,
          editorState: block.editorState ?? null,
        },
      ]
    }

    if (block.type !== "text") {
      nextSortOrder += 1
    }

    return []
  })
}

export function extractExistingMediaIdsFromEditDraft(
  draft: Pick<EditPostDraft, "blocks">
): string[] {
  return sortBySortOrder(draft.blocks).flatMap((block) => {
    if (block.type === "carousel") {
      return block.items.flatMap((item) =>
        item.media.kind === "existing" ? [item.media.mediaId] : []
      )
    }

    if (isExistingMediaBlock(block)) {
      return [block.media.mediaId]
    }

    return []
  })
}

export function extractRemovedExistingMediaIdsFromEditDraft(params: {
  current: Pick<EditPostDraft, "blocks">
  next: Pick<EditPostDraft, "blocks">
}): string[] {
  const currentIds = new Set(extractExistingMediaIdsFromEditDraft(params.current))
  const nextIds = new Set(extractExistingMediaIdsFromEditDraft(params.next))

  return Array.from(currentIds).filter((mediaId) => !nextIds.has(mediaId))
}

export function buildEditPostRemovedMediaDiff(params: {
  current: Pick<EditPostDraft, "blocks">
  next: Pick<EditPostDraft, "blocks">
}): EditPostRemovedMediaDiff {
  return {
    removedExistingMediaIds: extractRemovedExistingMediaIdsFromEditDraft(params),
  }
}

export function hasNewUploadedMediaInEditDraft(
  draft: Pick<EditPostDraft, "blocks">
): boolean {
  return draft.blocks.some((block) => {
    if (block.type === "carousel") {
      return block.items.some((item) => item.media.kind === "uploaded")
    }

    return isUploadedMediaBlock(block)
  })
}

export function buildEditPostDraftBlockFingerprint(
  draft: Pick<EditPostDraft, "blocks">
): string {
  return sortBySortOrder(draft.blocks)
    .map((block) => {
      if (block.type === "text") {
        return [
          "text",
          String(block.sortOrder),
          normalizeText(block.content),
          "",
        ].join(":")
      }

      if (block.type === "carousel") {
        const itemFingerprint = block.items
          .map((item, index) => {
            const mediaFingerprint =
              item.media.kind === "existing"
                ? `existing:${item.media.mediaId}`
                : `uploaded:${item.media.uploaded.path}`

            return [item.type, String(index), mediaFingerprint].join(":")
          })
          .join(",")

        return ["carousel", String(block.sortOrder), "", itemFingerprint].join(":")
      }

      const mediaFingerprint =
        block.media.kind === "existing"
          ? `existing:${block.media.mediaId}`
          : `uploaded:${block.media.uploaded.path}`

      return [
        block.type,
        String(block.sortOrder),
        "",
        mediaFingerprint,
      ].join(":")
    })
    .join("|")
}

function analyzeEditPostDraftMutation(params: {
  current: Pick<EditPostDraft, "blocks">
  next: Pick<EditPostDraft, "blocks">
}) {
  const currentContent = deriveEditPostContentFromDraft(params.current)
  const nextContent = deriveEditPostContentFromDraft(params.next)
  const currentBlockFingerprint = buildEditPostDraftBlockFingerprint(
    params.current
  )
  const nextBlockFingerprint = buildEditPostDraftBlockFingerprint(params.next)
  const uploadedMedia: EditPostUploadedMediaDiffItem[] =
    extractUploadedMediaFromEditDraft(params.next)
  const existingMediaIds = extractExistingMediaIdsFromEditDraft(params.next)
  const removedExistingMediaIds = extractRemovedExistingMediaIdsFromEditDraft(
    params
  )
  const hasNewMedia = uploadedMedia.length > 0
  const hasRemovedMedia = removedExistingMediaIds.length > 0

  return {
    currentContent,
    nextContent,
    currentBlockFingerprint,
    nextBlockFingerprint,
    uploadedMedia,
    existingMediaIds,
    removedExistingMediaIds,
    hasNewMedia,
    hasRemovedMedia,
  }
}

export function isEditDraftStructurallyEqual(params: {
  current: Pick<EditPostDraft, "blocks">
  next: Pick<EditPostDraft, "blocks">
}): boolean {
  const analysis = analyzeEditPostDraftMutation(params)

  return analysis.currentBlockFingerprint === analysis.nextBlockFingerprint
}

export function buildEditPostModerationComparisonInput(params: {
  current: Pick<EditPostDraft, "blocks">
  next: Pick<EditPostDraft, "blocks">
}): EditPostModerationComparisonInput {
  const analysis = analyzeEditPostDraftMutation(params)

  return {
    currentContent: analysis.currentContent,
    nextContent: analysis.nextContent,
    currentBlockFingerprint: analysis.currentBlockFingerprint,
    nextBlockFingerprint: analysis.nextBlockFingerprint,
    hasNewMedia: analysis.hasNewMedia,
    hasRemovedMedia: analysis.hasRemovedMedia,
  }
}

export function isRemoveOnlyEditDraftMutation(params: {
  current: Pick<EditPostDraft, "blocks">
  next: Pick<EditPostDraft, "blocks">
}): boolean {
  const analysis = analyzeEditPostDraftMutation(params)
  const currentContent = analysis.currentContent ?? ""
  const nextContent = analysis.nextContent ?? ""

  return (
    analysis.hasRemovedMedia &&
    !analysis.hasNewMedia &&
    currentContent === nextContent &&
    analysis.currentBlockFingerprint !== analysis.nextBlockFingerprint
  )
}

export function buildEditPostMediaDiff(params: {
  current: Pick<EditPostDraft, "blocks">
  next: Pick<EditPostDraft, "blocks">
}): EditPostMediaDiff {
  const analysis = analyzeEditPostDraftMutation(params)

  return {
    existingMediaIds: analysis.existingMediaIds,
    uploadedMedia: analysis.uploadedMedia,
    removedExistingMediaIds: analysis.removedExistingMediaIds,
    hasNewMedia: analysis.hasNewMedia,
    hasRemovedMedia: analysis.hasRemovedMedia,
  }
}

export function buildNormalizedEditPostUpdateDraft(params: {
  current: Pick<EditPostDraft, "blocks">
  next: EditPostDraft
}): NormalizedEditPostUpdateDraft {
  const analysis = analyzeEditPostDraftMutation(params)

  return {
    blocks: params.next.blocks,
    content: analysis.nextContent,
    blockFingerprint: analysis.nextBlockFingerprint,
    media: {
      existingMediaIds: analysis.existingMediaIds,
      uploadedMedia: analysis.uploadedMedia,
      removedExistingMediaIds: analysis.removedExistingMediaIds,
      hasNewMedia: analysis.hasNewMedia,
      hasRemovedMedia: analysis.hasRemovedMedia,
    },
    comparison: {
      currentContent: analysis.currentContent,
      nextContent: analysis.nextContent,
      currentBlockFingerprint: analysis.currentBlockFingerprint,
      nextBlockFingerprint: analysis.nextBlockFingerprint,
      hasNewMedia: analysis.hasNewMedia,
      hasRemovedMedia: analysis.hasRemovedMedia,
    },
    isStructuralEqualToCurrent:
      analysis.currentBlockFingerprint === analysis.nextBlockFingerprint,
    isRemoveOnlyMutation:
      analysis.hasRemovedMedia &&
      !analysis.hasNewMedia &&
      (analysis.currentContent ?? "") === (analysis.nextContent ?? "") &&
      analysis.currentBlockFingerprint !== analysis.nextBlockFingerprint,
  }
}
