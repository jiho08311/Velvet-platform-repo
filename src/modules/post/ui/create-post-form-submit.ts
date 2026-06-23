import type {
  CreatePostClientDraftBlock,
  CreatePostClientCarouselItem,
  CreatePostClientDraftMediaSource,
} from "@/modules/post/types"
import {
  createSerializedUploadedMediaSource,
  type EditorBlock,
} from "./create-post-form-model"

export type SerializedEditorSubmitResult = {
  blocks: CreatePostClientDraftBlock[]
  uploadedFiles: Record<string, File>
}

export function hasExistingMediaSource(
  media: CreatePostClientDraftMediaSource
): media is Extract<CreatePostClientDraftMediaSource, { kind: "existing" }> {
  return media.kind === "existing" && (media.mediaId?.trim() ?? "").length > 0
}

export function hasUploadedMediaFile(params: {
  media: CreatePostClientDraftMediaSource
  file?: File
}): params is {
  media: Extract<CreatePostClientDraftMediaSource, { kind: "uploaded" }>
  file: File
} {
  return (
    params.media.kind === "uploaded" && Boolean(params.file && params.file.size > 0)
  )
}

export function serializeMediaSourceForSubmit(params: {
  type: CreatePostClientCarouselItem["type"]
  media: CreatePostClientDraftMediaSource
  file?: File
  uploadedFiles: Record<string, File>
}): CreatePostClientCarouselItem | null {
  if (hasExistingMediaSource(params.media)) {
    return {
      type: params.type,
      media: params.media,
    }
  }

  if (!hasUploadedMediaFile({ media: params.media, file: params.file })) {
    return null
  }

  const placeholderId = params.media.uploaded.placeholderId
  const uploadedFile = params.file

  if (!uploadedFile) {
    return null
  }

  params.uploadedFiles[placeholderId] = uploadedFile

  return {
    type: params.type,
    media: createSerializedUploadedMediaSource({
      placeholderId,
      type: params.type,
      file: uploadedFile,
    }),
  }
}

export function serializeEditorBlocksForSubmit(
  blocks: EditorBlock[]
): SerializedEditorSubmitResult {
  const uploadedFiles: Record<string, File> = {}

  const serializedBlocks = blocks
    .flatMap((block): CreatePostClientDraftBlock[] => {
      if (block.type === "text") {
        const content = block.content?.trim() ?? ""

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
        const carouselGroupId = block.id

        const items = block.items.flatMap(
          (item, itemIndex): CreatePostClientCarouselItem[] => {
            const serializedItem = serializeMediaSourceForSubmit({
              type: item.type,
              media: item.media,
              file: item.file,
              uploadedFiles,
            })

            if (!serializedItem) {
              return []
            }

            const nextEditorState = {
              ...(serializedItem.editorState ?? item.editorState ?? null),
              carousel: {
                groupId: carouselGroupId,
                index: itemIndex,
                size: block.items.length,
              },
            }

            return [
              {
                ...serializedItem,
                editorState: nextEditorState,
              },
            ]
          }
        )

        if (items.length === 0) {
          return []
        }

        return [
          {
            type: "carousel",
            sortOrder: block.sortOrder,
            items,
            editorState: null,
          },
        ]
      }

      const serializedMedia = serializeMediaSourceForSubmit({
        type: block.type,
        media: block.media,
        file: block.file,
        uploadedFiles,
      })

      if (!serializedMedia) {
        return []
      }

      return [
        {
          ...serializedMedia,
          sortOrder: block.sortOrder,
          editorState: block.editorState ?? null,
        },
      ]
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return {
    blocks: serializedBlocks,
    uploadedFiles,
  }
}
