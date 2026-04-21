import type {
  CreatePostUploadedMediaInput,
  PostBlockEditorState,
  PostBlockType,
} from "../types"

type PersistedEditBlockInput = {
  type: Exclude<PostBlockType, "carousel">
  content?: string | null
  sortOrder: number
  mediaId?: string | null
  editorState?: PostBlockEditorState
}

type SubmittedEditBlockInput =
  | {
      type: "text"
      content?: string | null
      sortOrder: number
      editorState?: PostBlockEditorState
    }
  | {
      type: "image" | "video" | "audio" | "file"
      content?: string | null
      sortOrder: number
      mediaId?: string | null
      editorState?: PostBlockEditorState
    }
  | {
      type: "carousel"
      sortOrder: number
      items: EditPostDraftCarouselItem[]
      editorState?: null
    }

export type EditPostDraftMediaSource =
  | {
      kind: "existing"
      mediaId: string
    }
  | {
      kind: "uploaded"
      uploaded: CreatePostUploadedMediaInput
    }

export type EditPostDraftCarouselItem = {
  type: "image" | "video" | "audio" | "file"
  media: EditPostDraftMediaSource
  editorState?: PostBlockEditorState
}

export type EditPostDraftBlock =
  | {
      type: "text"
      content: string
      sortOrder: number
      editorState?: PostBlockEditorState
    }
  | {
      type: "image" | "video" | "audio" | "file"
      sortOrder: number
      media: EditPostDraftMediaSource
      editorState?: PostBlockEditorState
      content?: null
    }
  | {
      type: "carousel"
      sortOrder: number
      items: EditPostDraftCarouselItem[]
      editorState?: null
      content?: null
    }

export type EditPostDraft = {
  blocks: EditPostDraftBlock[]
}

export type EditPostModerationComparisonInput = {
  currentContent: string | null
  nextContent: string | null
  currentBlockFingerprint: string
  nextBlockFingerprint: string
  hasNewMedia: boolean
  hasRemovedMedia: boolean
}

type NormalizeSubmittedEditDraftInput = {
  blocks: SubmittedEditBlockInput[]
  uploadedFiles?: CreatePostUploadedMediaInput[]
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

function flattenPersistedMediaBlocksToDraft(
  blocks: PersistedEditBlockInput[]
): EditPostDraftBlock[] {
  const sorted = sortBySortOrder(blocks)
  const result: EditPostDraftBlock[] = []
  let mediaBuffer: PersistedEditBlockInput[] = []

  function flushMediaBuffer() {
    if (mediaBuffer.length === 0) return

const validMediaBlocks = mediaBuffer.filter(
  (
    block
  ): block is PersistedEditBlockInput & {
    type: "image" | "video" | "audio" | "file"
    mediaId: string
  } => isMediaType(block.type) && (block.mediaId?.trim() ?? "").length > 0
)

    for (const block of validMediaBlocks) {
      result.push({
        type: block.type,
        sortOrder: block.sortOrder,
        media: {
          kind: "existing",
          mediaId: block.mediaId.trim(),
        },
        editorState: block.editorState ?? null,
        content: null,
      })
    }

    mediaBuffer = []
  }

  for (const block of sorted) {
    if (block.type === "text") {
      flushMediaBuffer()

      result.push({
        type: "text",
        content: normalizeText(block.content),
        sortOrder: block.sortOrder,
        editorState: block.editorState ?? null,
      })

      continue
    }

    if (!isMediaType(block.type)) {
      continue
    }

    mediaBuffer.push(block)
  }

  flushMediaBuffer()

  return result
}

function flattenSubmittedMediaBlocksToDraft(input: NormalizeSubmittedEditDraftInput): EditPostDraftBlock[] {
  const sortedBlocks = sortBySortOrder(input.blocks)
  const uploadedFiles = input.uploadedFiles ?? []
  let uploadedFileIndex = 0

  return sortedBlocks.flatMap((block): EditPostDraftBlock[] => {
    if (block.type === "text") {
      const content = normalizeText(block.content)

      if (!content) {
        return []
      }

      return [
        {
          type: "text",
          content,
          sortOrder: block.sortOrder,
          editorState: block.editorState ?? null,
        },
      ]
    }

if (block.type === "carousel") {
  const items = block.items.flatMap((item): EditPostDraftCarouselItem[] => {
    if (item.media.kind === "existing") {
      const mediaId = item.media.mediaId.trim()

      if (!mediaId) {
        return []
      }

      return [
        {
          type: item.type,
          media: {
            kind: "existing",
            mediaId,
          },
          editorState: item.editorState ?? null,
        },
      ]
    }

    return [
      {
        type: item.type,
        media: {
          kind: "uploaded",
          uploaded: item.media.uploaded,
        },
        editorState: item.editorState ?? null,
      },
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

    const mediaId = block.mediaId?.trim() ?? ""

    if (mediaId) {
      return [
        {
          type: block.type,
          sortOrder: block.sortOrder,
          media: {
            kind: "existing",
            mediaId,
          },
          editorState: block.editorState ?? null,
          content: null,
        },
      ]
    }

    const uploaded = uploadedFiles[uploadedFileIndex]

    if (!uploaded) {
      return []
    }

    uploadedFileIndex += 1

    return [
      {
        type: block.type,
        sortOrder: block.sortOrder,
        media: {
          kind: "uploaded",
          uploaded,
        },
        editorState: block.editorState ?? null,
        content: null,
      },
    ]
  })
}

/**
 * Persisted blocks -> normalized edit draft
 */
export function buildInitialEditPostDraft(params: {
  blocks: PersistedEditBlockInput[]
}): EditPostDraft {
  return {
    blocks: flattenPersistedMediaBlocksToDraft(params.blocks),
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
): Array<{
  type: Exclude<PostBlockType, "carousel">
  content?: string | null
  sortOrder: number
  mediaId?: string | null
  editorState?: PostBlockEditorState
}> {
  let nextSortOrder = 0

  return sortBySortOrder(draft.blocks).flatMap(
    (
      block
    ): Array<{
      type: Exclude<PostBlockType, "carousel">
      content?: string | null
      sortOrder: number
      mediaId?: string | null
      editorState?: PostBlockEditorState
    }> => {
      if (block.type === "text") {
        const content = normalizeText(block.content)

        if (!content) {
          return []
        }

        const currentSortOrder = nextSortOrder
        nextSortOrder += 1

        return [
          {
            type: "text",
            content,
            sortOrder: currentSortOrder,
            mediaId: null,
            editorState: block.editorState ?? null,
          },
        ]
      }

   
if (block.type === "carousel") {
  const items: Array<{
    type: Exclude<PostBlockType, "carousel">
    content?: string | null
    sortOrder: number
    mediaId?: string | null
    editorState?: PostBlockEditorState
  }> = block.items.map((item) => {
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

  return items
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
    }
  )
}

export function extractUploadedMediaFromEditDraft(
  draft: Pick<EditPostDraft, "blocks">
): Array<{
  type: "image" | "video" | "audio" | "file"
  sortOrder: number
  uploaded: CreatePostUploadedMediaInput
  editorState?: PostBlockEditorState
}> {
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

export function isEditDraftStructurallyEqual(params: {
  current: Pick<EditPostDraft, "blocks">
  next: Pick<EditPostDraft, "blocks">
}): boolean {
  return (
    buildEditPostDraftBlockFingerprint(params.current) ===
    buildEditPostDraftBlockFingerprint(params.next)
  )
}

export function buildEditPostModerationComparisonInput(params: {
  current: Pick<EditPostDraft, "blocks">
  next: Pick<EditPostDraft, "blocks">
}): EditPostModerationComparisonInput {
  return {
    currentContent: deriveEditPostContentFromDraft(params.current),
    nextContent: deriveEditPostContentFromDraft(params.next),
    currentBlockFingerprint: buildEditPostDraftBlockFingerprint(params.current),
    nextBlockFingerprint: buildEditPostDraftBlockFingerprint(params.next),
    hasNewMedia: hasNewUploadedMediaInEditDraft(params.next),
    hasRemovedMedia: extractRemovedExistingMediaIdsFromEditDraft({
      current: params.current,
      next: params.next,
    }).length > 0,
  }
}

export function isRemoveOnlyEditDraftMutation(params: {
  current: Pick<EditPostDraft, "blocks">
  next: Pick<EditPostDraft, "blocks">
}): boolean {
  const comparison = buildEditPostModerationComparisonInput(params)

  const currentContent = comparison.currentContent ?? ""
  const nextContent = comparison.nextContent ?? ""

  return (
    comparison.hasRemovedMedia &&
    !comparison.hasNewMedia &&
    currentContent === nextContent &&
    comparison.currentBlockFingerprint !== comparison.nextBlockFingerprint
  )
}