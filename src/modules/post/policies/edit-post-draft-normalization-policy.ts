import type {
  CreatePostClientDraftBlock,
  CreatePostUploadedMediaInput,
  PersistedPostEditorBlockInput,
  PostBlockEditorState,
  PostBlockType,
} from "../types"
import { buildPostEditorDraftFromPersistedBlocks } from "@/modules/post/mappers/post-editor-draft-normalizer"

import {
  buildTextDraftBlock,
  normalizeText,
  sortBySortOrder,
  type EditPostDraft,
  type EditPostDraftBlock,
  type EditPostDraftCarouselItem,
  type EditPostDraftMediaSource,
} from "./edit-post-draft-shared"

type NormalizeSubmittedEditDraftInput = {
  blocks: CreatePostClientDraftBlock[]
  uploadedFiles?: CreatePostUploadedMediaInput[]
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

function flattenSubmittedMediaBlocksToDraft(
  input: NormalizeSubmittedEditDraftInput
): EditPostDraftBlock[] {
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

      return draftBlock ? [draftBlock] : []
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

      return items.length > 0
        ? [
            {
              type: "carousel",
              sortOrder: block.sortOrder,
              items,
              editorState: null,
              content: null,
            },
          ]
        : []
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

export function buildInitialEditPostDraft(params: {
  blocks: PersistedPostEditorBlockInput[]
}): EditPostDraft {
  return {
    blocks: buildPostEditorDraftFromPersistedBlocks(params.blocks),
  }
}

export function buildSubmittedEditPostDraft(
  input: NormalizeSubmittedEditDraftInput
): EditPostDraft {
  return {
    blocks: flattenSubmittedMediaBlocksToDraft(input).filter(
      (block) => block.type !== "text" || normalizeText(block.content).length > 0
    ),
  }
}
