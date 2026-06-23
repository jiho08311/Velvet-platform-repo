import type {
  EditPostMediaDiff,
  EditPostRemovedMediaDiff,
  NormalizedEditPostUpdateDraft,
  PersistedPostEditorBlockInput,
  PostEditModerationReentryInput,
} from "../types"
import {
  analyzeEditPostDraftMutation,
  deriveEditPostContentFromDraft,
  extractRemovedExistingMediaIdsFromEditDraft,
} from "./edit-post-draft-analysis-policy"
import {
  buildTextDraftBlock,
  isExistingMediaBlock,
  isUploadedMediaBlock,
  sortBySortOrder,
  type EditPostDraft,
} from "./edit-post-draft-shared"
export {
  buildEditPostDraftBlockFingerprint,
  deriveEditPostContentFromDraft,
  extractExistingMediaIdsFromEditDraft,
  extractRemovedExistingMediaIdsFromEditDraft,
  extractUploadedMediaFromEditDraft,
  hasNewUploadedMediaInEditDraft,
} from "./edit-post-draft-analysis-policy"
export {
  buildInitialEditPostDraft,
  buildSubmittedEditPostDraft,
} from "./edit-post-draft-normalization-policy"
export type {
  EditPostDraft,
  EditPostDraftBlock,
  EditPostDraftCarouselItem,
  EditPostDraftMediaSource,
  UploadedEditDraftMedia,
} from "./edit-post-draft-shared"

export type EditPostModerationComparisonInput = PostEditModerationReentryInput

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

export function buildEditPostRemovedMediaDiff(params: {
  current: Pick<EditPostDraft, "blocks">
  next: Pick<EditPostDraft, "blocks">
}): EditPostRemovedMediaDiff {
  return {
    removedExistingMediaIds: extractRemovedExistingMediaIdsFromEditDraft(params),
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
