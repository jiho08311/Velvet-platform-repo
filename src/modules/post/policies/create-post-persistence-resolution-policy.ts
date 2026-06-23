import type {
  CreatePostBlockInput,
  CreatePostBlockPersistencePlanItem,
  CreatePostDraftProjection,
  CreatePostPersistedMediaMappingItem,
  CreatePostResolvedMediaItem,
  CreatePostResolvedPersistencePlan,
} from "../types"

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
  const resolvedPersistedMedia = params.projection.mediaToCreate.map(
    (mediaItem) => {
      const persistedMedia = params.persistedMediaByProjectionKey.get(
        mediaItem.projectionKey
      )

      if (!persistedMedia) {
        throw new Error(
          `Missing persisted media mapping for projection key: ${mediaItem.projectionKey}`
        )
      }

      return persistedMedia
    }
  )

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
      persistedMediaByProjectionKey:
        persistenceContext.persistedMediaByProjectionKey,
    }),
    persistedMedia: persistenceContext.resolvedPersistedMedia,
    resolvedMedia: resolveCreatePostResolvedMedia(
      persistenceContext.resolvedPersistedMedia
    ),
  }
}
