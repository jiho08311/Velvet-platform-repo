import type {
  CreatePostBlockInput,
  CreatePostDraftBlock,
  CreatePostDraftInput,
  CreatePostDraftProjection,
  CreatePostDraftProjectionKey,
  CreatePostMediaCreationPlanItem,
  CreatePostPersistenceProjectionItem,
  CreatePostUploadedMediaBinding,
} from "../types"

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

function buildUploadedMediaProjectionKey(params: {
  blockSortOrder: number
  itemIndex?: number
}): CreatePostDraftProjectionKey {
  if (params.itemIndex === undefined) {
    return `block:${params.blockSortOrder}`
  }

  return `carousel:${params.blockSortOrder}:${params.itemIndex}`
}

function buildUploadedMediaBinding(params: {
  blockSortOrder: number
  type: CreatePostUploadedMediaBinding["type"]
  uploaded: CreatePostUploadedMediaBinding["uploaded"]
  editorState?: CreatePostUploadedMediaBinding["editorState"]
  itemIndex?: number
}): CreatePostUploadedMediaBinding {
  return {
    projectionKey: buildUploadedMediaProjectionKey({
      blockSortOrder: params.blockSortOrder,
      itemIndex: params.itemIndex,
    }),
    type: params.type,
    sortOrder:
      params.itemIndex === undefined
        ? params.blockSortOrder
        : params.blockSortOrder * 1000 + params.itemIndex,
    uploaded: params.uploaded,
    editorState: params.editorState ?? null,
  }
}

function buildUploadedMediaPersistenceItem(params: {
  block: CreatePostPersistenceProjectionItem["block"]
  uploadedMediaBinding: CreatePostUploadedMediaBinding
}): CreatePostPersistenceProjectionItem {
  return {
    kind: "uploaded-media",
    block: params.block,
    uploadedMediaBinding: params.uploadedMediaBinding,
  }
}

function extractMediaCreationPlanItems(
  persistenceItems: CreatePostPersistenceProjectionItem[]
): CreatePostMediaCreationPlanItem[] {
  return persistenceItems
    .flatMap((item): CreatePostMediaCreationPlanItem[] => {
      if (!item.uploadedMediaBinding) {
        return []
      }

      return [item.uploadedMediaBinding]
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function isNonEmptyTextBlock(
  block: CreatePostDraftBlock
): block is Extract<CreatePostDraftBlock, { type: "text" }> {
  return block.type === "text" && normalizeText(block.content).length > 0
}

function isUploadedMediaBlock(
  block: CreatePostDraftBlock
): block is Extract<
  CreatePostDraftBlock,
  { type: "image" | "video" | "audio" | "file" }
> & {
  media: {
    kind: "uploaded"
    uploaded: CreatePostUploadedMediaBinding["uploaded"]
  }
} {
  return (
    block.type !== "text" &&
    block.type !== "carousel" &&
    block.media.kind === "uploaded"
  )
}

function isExistingMediaBlock(
  block: CreatePostDraftBlock
): block is Extract<
  CreatePostDraftBlock,
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

export function deriveCreatePostContentFromDraft(
  draft: Pick<CreatePostDraftInput, "blocks">
): string | null {
  const content = draft.blocks
    .filter(isNonEmptyTextBlock)
    .map((block) => normalizeText(block.content))
    .join("\n\n")
    .trim()

  return content.length > 0 ? content : null
}

export function projectCreatePostMediaPlanFromDraft(
  draft: Pick<CreatePostDraftInput, "blocks">
): CreatePostMediaCreationPlanItem[] {
  return extractMediaCreationPlanItems(
    projectCreatePostPersistenceItemsFromDraft(draft)
  )
}

export function projectCreatePostBlocksFromDraft(
  draft: Pick<CreatePostDraftInput, "blocks">
): CreatePostBlockInput[] {
  return projectCreatePostPersistenceItemsFromDraft(draft).map(
    (item) => item.block
  )
}

export function resolveCreatePostBlocksForPersistence(params: {
  persistenceItems: CreatePostPersistenceProjectionItem[]
  mediaIdByProjectionKey: ReadonlyMap<CreatePostDraftProjectionKey, string>
}): CreatePostBlockInput[] {
  return params.persistenceItems.flatMap((item): CreatePostBlockInput[] => {
    if (!item.uploadedMediaBinding) {
      return [item.block]
    }

    const mediaId = params.mediaIdByProjectionKey.get(
      item.uploadedMediaBinding.projectionKey
    )

    if (!mediaId) {
      return []
    }

    return [
      {
        ...item.block,
        mediaId,
      },
    ]
  })
}

export function projectCreatePostPersistenceItemsFromDraft(
  draft: Pick<CreatePostDraftInput, "blocks">
): CreatePostPersistenceProjectionItem[] {
  return draft.blocks
    .flatMap((block): CreatePostPersistenceProjectionItem[] => {
      if (block.type === "text") {
        const content = normalizeText(block.content)

        if (!content) {
          return []
        }

        return [
          {
            kind: "text",
            block: {
              type: "text",
              content,
              sortOrder: block.sortOrder,
              editorState: block.editorState ?? null,
            },
            uploadedMediaBinding: null,
          },
        ]
      }

      if (block.type === "carousel") {
        const groupId = `carousel-${block.sortOrder}`

        return block.items.flatMap(
          (item, itemIndex): CreatePostPersistenceProjectionItem[] => {
          const baseEditorState = item.editorState ?? null
          const sortOrder = block.sortOrder * 1000 + itemIndex

          const carouselMeta = {
            carousel: {
              groupId,
              index: itemIndex,
              size: block.items.length,
            },
          }

          if (item.media.kind === "existing") {
            const mediaId = item.media.mediaId.trim()

            if (!mediaId) {
              return []
            }

            return [
              {
                kind: "existing-media",
                block: {
                  type: item.type,
                  mediaId,
                  sortOrder,
                  editorState: {
                    ...(baseEditorState ?? {}),
                    ...carouselMeta,
                  },
                },
                uploadedMediaBinding: null,
              },
            ]
          }

          const uploadedMediaBinding = buildUploadedMediaBinding({
            blockSortOrder: block.sortOrder,
            itemIndex,
            type: item.type,
            uploaded: item.media.uploaded,
            editorState: item.editorState ?? null,
          })

          return [
            buildUploadedMediaPersistenceItem({
              block: {
                type: item.type,
                sortOrder,
                editorState: {
                  ...(baseEditorState ?? {}),
                  ...carouselMeta,
                },
              },
              uploadedMediaBinding,
            }),
          ]
        })
      }

      if (isExistingMediaBlock(block)) {
        const mediaId = block.media.mediaId.trim()

        if (!mediaId) {
          return []
        }

        return [
          {
            kind: "existing-media",
            block: {
              type: block.type,
              mediaId,
              sortOrder: block.sortOrder,
              editorState: block.editorState ?? null,
            },
            uploadedMediaBinding: null,
          },
        ]
      }

      if (isUploadedMediaBlock(block)) {
        const uploadedMediaBinding = buildUploadedMediaBinding({
          blockSortOrder: block.sortOrder,
          type: block.type,
          uploaded: block.media.uploaded,
          editorState: block.editorState ?? null,
        })

        return [
          buildUploadedMediaPersistenceItem({
            block: {
              type: block.type,
              sortOrder: block.sortOrder,
              editorState: block.editorState ?? null,
            },
            uploadedMediaBinding,
          }),
        ]
      }

      return []
    })
    .sort((a, b) => a.block.sortOrder - b.block.sortOrder)
}

export function projectCreatePostDraft(
  draft: Pick<CreatePostDraftInput, "blocks">
): CreatePostDraftProjection {
  const persistenceItems = projectCreatePostPersistenceItemsFromDraft(draft)
  const mediaToCreate = extractMediaCreationPlanItems(persistenceItems)

  return {
    content: deriveCreatePostContentFromDraft(draft),
    persistenceItems,
    mediaToCreate,
  }
}
