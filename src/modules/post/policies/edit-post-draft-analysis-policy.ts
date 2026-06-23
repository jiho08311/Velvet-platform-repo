import type { EditPostUploadedMediaDiffItem } from "../types"

import {
  isExistingMediaBlock,
  isNonEmptyTextBlock,
  isUploadedMediaBlock,
  normalizeText,
  sortBySortOrder,
  type EditPostDraft,
  type UploadedEditDraftMedia,
} from "./edit-post-draft-shared"

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

        return ["carousel", String(block.sortOrder), "", itemFingerprint].join(
          ":"
        )
      }

      const mediaFingerprint =
        block.media.kind === "existing"
          ? `existing:${block.media.mediaId}`
          : `uploaded:${block.media.uploaded.path}`

      return [block.type, String(block.sortOrder), "", mediaFingerprint].join(
        ":"
      )
    })
    .join("|")
}

export function analyzeEditPostDraftMutation(params: {
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
