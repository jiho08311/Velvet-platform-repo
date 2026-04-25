import type {
  CreatePostBlockInput,
  CreatePostBlockPersistencePlanItem,
  CreatePostPersistenceCoordinates,
  CreatePostDraftBlock,
  CreatePostDraftInput,
  CreatePostDraftProjection,
  CreatePostDraftProjectionKey,
  CreatePostMediaCreationPlanItem,
  CreatePostResolvedMediaItem,
  CreatePostPersistedMediaMappingItem,
  CreatePostResolvedPersistencePlan,
  CreatePostUploadedMediaInput,
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
  coordinates: CreatePostPersistenceCoordinates
}): CreatePostUploadedMediaBinding {
  return {
    projectionKey: buildUploadedMediaProjectionKey({
      blockSortOrder: params.blockSortOrder,
      itemIndex: params.itemIndex,
    }),
    type: params.type,
    sortOrder: params.coordinates.mediaSortOrder ?? params.coordinates.blockSortOrder,
    uploaded: params.uploaded,
    editorState: params.editorState ?? null,
    coordinates: params.coordinates,
  }
}

function buildUploadedMediaPersistenceItem(params: {
  block: CreatePostBlockPersistencePlanItem["block"]
  uploadedMediaBinding: CreatePostUploadedMediaBinding
  coordinates: CreatePostPersistenceCoordinates
}): CreatePostBlockPersistencePlanItem {
  return {
    kind: "uploaded-media",
    block: params.block,
    media: {
      kind: "uploaded",
      binding: params.uploadedMediaBinding,
    },
    coordinates: params.coordinates,
  }
}

function buildPersistenceCoordinates(params: {
  blockSortOrder: number
  itemIndex?: number
  carouselGroupId?: string
}): CreatePostPersistenceCoordinates {
  return {
    blockSortOrder:
      params.itemIndex === undefined
        ? params.blockSortOrder
        : params.blockSortOrder * 1000 + params.itemIndex,
    mediaSortOrder:
      params.itemIndex === undefined
        ? params.blockSortOrder
        : params.blockSortOrder * 1000 + params.itemIndex,
    carouselGroupId: params.carouselGroupId ?? null,
    carouselItemIndex: params.itemIndex ?? null,
  }
}

function buildTextPersistenceItem(params: {
  content: string
  coordinates: CreatePostPersistenceCoordinates
  editorState?: CreatePostBlockPersistencePlanItem["block"]["editorState"]
}): CreatePostBlockPersistencePlanItem {
  return {
    kind: "text",
    block: {
      type: "text",
      content: params.content,
      sortOrder: params.coordinates.blockSortOrder,
      editorState: params.editorState ?? null,
    },
    media: {
      kind: "none",
    },
    coordinates: params.coordinates,
  }
}

function buildExistingMediaPersistenceItem(params: {
  type: Exclude<CreatePostBlockPersistencePlanItem["block"]["type"], "text" | "carousel">
  mediaId: string
  coordinates: CreatePostPersistenceCoordinates
  editorState?: CreatePostBlockPersistencePlanItem["block"]["editorState"]
}): CreatePostBlockPersistencePlanItem {
  return {
    kind: "existing-media",
    block: {
      type: params.type,
      mediaId: params.mediaId,
      sortOrder: params.coordinates.blockSortOrder,
      editorState: params.editorState ?? null,
    },
    media: {
      kind: "existing",
      mediaId: params.mediaId,
    },
    coordinates: params.coordinates,
  }
}

function extractMediaCreationPlanItems(
  blocksToPersist: CreatePostBlockPersistencePlanItem[]
): CreatePostMediaCreationPlanItem[] {
  return blocksToPersist
    .flatMap((item): CreatePostMediaCreationPlanItem[] => {
      if (item.media.kind !== "uploaded") {
        return []
      }

      return [item.media.binding]
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

export function extractCreatePostModerationFiles(params: {
  projection: Pick<CreatePostDraftProjection, "mediaToCreate">
}): CreatePostUploadedMediaInput[] {
  return params.projection.mediaToCreate.map((item) => item.uploaded)
}

function indexPersistedMediaByProjectionKey(
  persistedMedia: CreatePostPersistedMediaMappingItem[]
): Map<CreatePostPersistedMediaMappingItem["projectionKey"], CreatePostPersistedMediaMappingItem> {
  const persistedMediaByProjectionKey = new Map<
    CreatePostPersistedMediaMappingItem["projectionKey"],
    CreatePostPersistedMediaMappingItem
  >()

  for (const item of persistedMedia) {
    const mediaId = item.mediaId.trim()

    if (!mediaId) {
      throw new Error("Persisted media mapping must include mediaId")
    }

    if (persistedMediaByProjectionKey.has(item.projectionKey)) {
      throw new Error(
        `Duplicate persisted media mapping for projection key: ${item.projectionKey}`
      )
    }

    persistedMediaByProjectionKey.set(item.projectionKey, {
      ...item,
      mediaId,
    })
  }

  return persistedMediaByProjectionKey
}

function resolvePersistedMediaFromProjection(params: {
  projection: Pick<CreatePostDraftProjection, "mediaToCreate">
  persistedMediaByProjectionKey: ReadonlyMap<
    CreatePostPersistedMediaMappingItem["projectionKey"],
    CreatePostPersistedMediaMappingItem
  >
}): CreatePostPersistedMediaMappingItem[] {
  const resolvedPersistedMedia = params.projection.mediaToCreate.map((mediaItem) => {
    const persistedMedia = params.persistedMediaByProjectionKey.get(mediaItem.projectionKey)

    if (!persistedMedia) {
      throw new Error(
        `Missing persisted media mapping for projection key: ${mediaItem.projectionKey}`
      )
    }

    return persistedMedia
  })

  if (resolvedPersistedMedia.length !== params.persistedMediaByProjectionKey.size) {
    throw new Error("Persisted media mapping contains unexpected projection keys")
  }

  return resolvedPersistedMedia
}

type CreatePostPersistenceResolutionContext = {
  persistedMediaByProjectionKey: ReadonlyMap<
    CreatePostPersistedMediaMappingItem["projectionKey"],
    CreatePostPersistedMediaMappingItem
  >
  resolvedPersistedMedia: CreatePostPersistedMediaMappingItem[]
}

function resolveCreatePostPersistenceContext(params: {
  projection: Pick<CreatePostDraftProjection, "mediaToCreate">
  persistedMedia: CreatePostPersistedMediaMappingItem[]
}): CreatePostPersistenceResolutionContext {
  const persistedMediaByProjectionKey = indexPersistedMediaByProjectionKey(
    params.persistedMedia
  )

  return {
    persistedMediaByProjectionKey,
    resolvedPersistedMedia: resolvePersistedMediaFromProjection({
      projection: params.projection,
      persistedMediaByProjectionKey,
    }),
  }
}

function resolveCreatePostResolvedMedia(
  persistedMedia: CreatePostPersistedMediaMappingItem[]
): CreatePostResolvedMediaItem[] {
  return persistedMedia.map((item) => ({
    id: item.mediaId,
    type: item.type,
    storagePath: item.storagePath,
  }))
}

function resolveCreatePostBlocksForPersistence(params: {
  blocksToPersist: CreatePostBlockPersistencePlanItem[]
  persistedMediaByProjectionKey: ReadonlyMap<
    CreatePostPersistedMediaMappingItem["projectionKey"],
    CreatePostPersistedMediaMappingItem
  >
}): CreatePostBlockInput[] {
  return params.blocksToPersist.flatMap((item): CreatePostBlockInput[] => {
    if (item.media.kind === "none") {
      return [item.block]
    }

    if (item.media.kind === "existing") {
      return [
        {
          ...item.block,
          mediaId: item.media.mediaId,
        },
      ]
    }

    const persistedMedia = params.persistedMediaByProjectionKey.get(
      item.media.binding.projectionKey
    )

    if (!persistedMedia) {
      throw new Error(
        `Missing persisted media mapping for projection key: ${item.media.binding.projectionKey}`
      )
    }

    return [
      {
        ...item.block,
        mediaId: persistedMedia.mediaId,
      },
    ]
  })
}

export function resolveCreatePostPersistenceFromProjection(params: {
  projection: Pick<CreatePostDraftProjection, "blocksToPersist" | "mediaToCreate">
  persistedMedia: CreatePostPersistedMediaMappingItem[]
}): CreatePostResolvedPersistencePlan {
  const persistenceContext = resolveCreatePostPersistenceContext({
    projection: params.projection,
    persistedMedia: params.persistedMedia,
  })

  return {
    blocksToInsert: resolveCreatePostBlocksForPersistence({
      blocksToPersist: params.projection.blocksToPersist,
      persistedMediaByProjectionKey: persistenceContext.persistedMediaByProjectionKey,
    }),
    persistedMedia: persistenceContext.resolvedPersistedMedia,
    resolvedMedia: resolveCreatePostResolvedMedia(
      persistenceContext.resolvedPersistedMedia
    ),
  }
}

/**
 * The only create-time persistence projection builder.
 * This establishes the full persistence contract for:
 * - post content derivation
 * - post_blocks rows
 * - uploaded media creation rows
 * - block-to-media linkage via projection keys and coordinates
 */
function projectCreatePostPersistenceItemsFromDraft(
  draft: Pick<CreatePostDraftInput, "blocks">
): CreatePostBlockPersistencePlanItem[] {
  return draft.blocks
    .flatMap((block): CreatePostBlockPersistencePlanItem[] => {
      if (block.type === "text") {
        const content = normalizeText(block.content)

        if (!content) {
          return []
        }

        return [
          buildTextPersistenceItem({
            content,
            coordinates: buildPersistenceCoordinates({
              blockSortOrder: block.sortOrder,
            }),
            editorState: block.editorState ?? null,
          }),
        ]
      }

      if (block.type === "carousel") {
        const groupId = `carousel-${block.sortOrder}`

        return block.items.flatMap(
          (item, itemIndex): CreatePostBlockPersistencePlanItem[] => {
            const baseEditorState = item.editorState ?? null
            const coordinates = buildPersistenceCoordinates({
              blockSortOrder: block.sortOrder,
              itemIndex,
              carouselGroupId: groupId,
            })

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
                buildExistingMediaPersistenceItem({
                  type: item.type,
                  mediaId,
                  coordinates,
                  editorState: {
                    ...(baseEditorState ?? {}),
                    ...carouselMeta,
                  },
                }),
              ]
            }

            const uploadedMediaBinding = buildUploadedMediaBinding({
              blockSortOrder: block.sortOrder,
              itemIndex,
              type: item.type,
              uploaded: item.media.uploaded,
              editorState: item.editorState ?? null,
              coordinates,
            })

            return [
              buildUploadedMediaPersistenceItem({
                block: {
                  type: item.type,
                  sortOrder: coordinates.blockSortOrder,
                  editorState: {
                    ...(baseEditorState ?? {}),
                    ...carouselMeta,
                  },
                },
                uploadedMediaBinding,
                coordinates,
              }),
            ]
          }
        )
      }

      if (isExistingMediaBlock(block)) {
        const mediaId = block.media.mediaId.trim()

        if (!mediaId) {
          return []
        }

        return [
          buildExistingMediaPersistenceItem({
            type: block.type,
            mediaId,
            coordinates: buildPersistenceCoordinates({
              blockSortOrder: block.sortOrder,
            }),
            editorState: block.editorState ?? null,
          }),
        ]
      }

      if (isUploadedMediaBlock(block)) {
        const coordinates = buildPersistenceCoordinates({
          blockSortOrder: block.sortOrder,
        })
        const uploadedMediaBinding = buildUploadedMediaBinding({
          blockSortOrder: block.sortOrder,
          type: block.type,
          uploaded: block.media.uploaded,
          editorState: block.editorState ?? null,
          coordinates,
        })

        return [
          buildUploadedMediaPersistenceItem({
            block: {
              type: block.type,
              sortOrder: coordinates.blockSortOrder,
              editorState: block.editorState ?? null,
            },
            uploadedMediaBinding,
            coordinates,
          }),
        ]
      }

      return []
    })
    .sort((a, b) => a.block.sortOrder - b.block.sortOrder)
}

/**
 * Public create projection entrypoint.
 * Downstream workflow code should consume this projection directly rather than
 * rebuilding persistence rules from the raw draft.
 */
export function projectCreatePostDraft(
  draft: Pick<CreatePostDraftInput, "blocks">
): CreatePostDraftProjection {
  const blocksToPersist = projectCreatePostPersistenceItemsFromDraft(draft)
  const mediaToCreate = extractMediaCreationPlanItems(blocksToPersist)

  return {
    content: deriveCreatePostContentFromDraft(draft),
    blocksToPersist,
    mediaToCreate,
  }
}
