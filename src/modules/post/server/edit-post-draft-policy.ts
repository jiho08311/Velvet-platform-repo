import type {
  CreatePostUploadedMediaInput,
  PostBlockEditorState,
  PostBlockType,
} from "../types"

type PersistedEditBlockInput = {
  type: PostBlockType
  content?: string | null
  sortOrder: number
  mediaId?: string | null
  editorState?: PostBlockEditorState
}

type SubmittedEditBlockInput = {
  type: PostBlockType
  content?: string | null
  sortOrder: number
  mediaId?: string | null
  editorState?: PostBlockEditorState
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

export type EditPostDraftBlock =
  | {
      type: "text"
      content: string
      sortOrder: number
      editorState?: PostBlockEditorState
    }
  | {
      type: Exclude<PostBlockType, "text">
      sortOrder: number
      media: EditPostDraftMediaSource
      editorState?: PostBlockEditorState
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
): type is Exclude<PostBlockType, "text"> {
  return type !== "text"
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
  return block.type !== "text" && block.media.kind === "existing"
}

function isUploadedMediaBlock(
  block: EditPostDraftBlock
): block is Extract<
  EditPostDraftBlock,
  { type: "image" | "video" | "audio" | "file" }
> & {
  media: { kind: "uploaded"; uploaded: CreatePostUploadedMediaInput }
} {
  return block.type !== "text" && block.media.kind === "uploaded"
}

/**
 * Persisted blocks -> normalized edit draft
 */
export function buildInitialEditPostDraft(params: {
  blocks: PersistedEditBlockInput[]
}): EditPostDraft {
  return {
    blocks: sortBySortOrder(params.blocks).flatMap((block): EditPostDraftBlock[] => {
      if (block.type === "text") {
        const content = normalizeText(block.content)

        return [
          {
            type: "text",
            content,
            sortOrder: block.sortOrder,
            editorState: block.editorState ?? null,
          },
        ]
      }

      if (!isMediaType(block.type)) {
        return []
      }

      const mediaId = block.mediaId?.trim() ?? ""

      if (!mediaId) {
        return []
      }

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
    }),
  }
}

/**
 * Current submit shape(blocks + uploadedFiles) -> normalized edit draft
 *
 * Current form/runtime still submits:
 * - existing media blocks with mediaId
 * - new media blocks without mediaId
 * - uploadedFiles array in media block order
 *
 * This helper normalizes that mixed submit input into one draft model.
 */
export function buildSubmittedEditPostDraft(
  input: NormalizeSubmittedEditDraftInput
): EditPostDraft {
  const sortedBlocks = sortBySortOrder(input.blocks)
  const uploadedFiles = input.uploadedFiles ?? []
  let uploadedFileIndex = 0

  return {
    blocks: sortedBlocks.flatMap((block): EditPostDraftBlock[] => {
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
    }),
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
  type: PostBlockType
  content?: string | null
  sortOrder: number
  mediaId?: string | null
  editorState?: PostBlockEditorState
}> {
return sortBySortOrder(draft.blocks).flatMap(
  (
    block
  ): Array<{
    type: PostBlockType
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

      return [
        {
          type: "text" as const,
          content,
          sortOrder: block.sortOrder,
          mediaId: null,
          editorState: block.editorState ?? null,
        },
      ]
    }

    if (isExistingMediaBlock(block)) {
      return [
        {
          type: block.type,
          content: null,
          sortOrder: block.sortOrder,
          mediaId: block.media.mediaId,
          editorState: block.editorState ?? null,
        },
      ]
    }

    if (isUploadedMediaBlock(block)) {
      return [
        {
          type: block.type,
          content: null,
          sortOrder: block.sortOrder,
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
): Array<{
  type: Exclude<PostBlockType, "text">
  sortOrder: number
  uploaded: CreatePostUploadedMediaInput
  editorState?: PostBlockEditorState
}> {
  return sortBySortOrder(draft.blocks)
    .filter(isUploadedMediaBlock)
    .map((block) => ({
      type: block.type,
      sortOrder: block.sortOrder,
      uploaded: block.media.uploaded,
      editorState: block.editorState ?? null,
    }))
}

export function extractExistingMediaIdsFromEditDraft(
  draft: Pick<EditPostDraft, "blocks">
): string[] {
  return sortBySortOrder(draft.blocks)
    .filter(isExistingMediaBlock)
    .map((block) => block.media.mediaId)
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
  return draft.blocks.some(isUploadedMediaBlock)
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