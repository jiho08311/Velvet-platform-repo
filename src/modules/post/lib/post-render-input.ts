import type {
  PostBlock,
  PostNormalizedRenderGroup,
  PostRenderInput,
  PostRenderMediaItem,
} from "../types"

type BuildPostRenderInputParams = {
  text: string
  media?: PostRenderMediaItem[]
  blocks?: PostBlock[]
}

type PostRenderMediaEntry = {
  media: PostRenderMediaItem
  block?: PostBlock
}

type ResolvedMediaContext = {
  mediaById: Map<string, PostRenderMediaItem>
  resolvedMedia: PostRenderMediaItem[]
}

function buildResolvedMediaContext(params: {
  media?: PostRenderMediaItem[]
}): ResolvedMediaContext {
  const resolvedMedia = params.media ?? []
  const mediaById = new Map<string, PostRenderMediaItem>()

  for (const item of resolvedMedia) {
    const mediaId = item.id?.trim() ?? ""

    if (!mediaId) {
      continue
    }

    mediaById.set(mediaId, item)
  }

  return {
    mediaById,
    resolvedMedia,
  }
}

function buildMediaEntryMap(params: {
  blocks: PostBlock[]
  mediaById: Map<string, PostRenderMediaItem>
}): Map<string, PostBlock> {
  const map = new Map<string, PostBlock>()

  for (const block of params.blocks) {
    if (block.type === "text") {
      continue
    }

    const mediaId = block.mediaId?.trim() ?? ""

    if (!mediaId) {
      continue
    }

    if (!params.mediaById.has(mediaId)) {
      continue
    }

    map.set(mediaId, block)
  }

  return map
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

function buildBlockText(params: {
  hasBlocks: boolean
  blocks: PostBlock[]
  text: string
}): string {
  if (!params.hasBlocks) {
    return params.text
  }

  return params.blocks
    .filter((block) => block.type === "text" && normalizeText(block.content))
    .map((block) => normalizeText(block.content))
    .join("\n\n")
}

function buildBlockMedia(params: {
  hasBlocks: boolean
  blocks: PostBlock[]
  mediaById: Map<string, PostRenderMediaItem>
  resolvedMedia: PostRenderMediaItem[]
}): PostRenderMediaItem[] {
  if (!params.hasBlocks || params.resolvedMedia.length === 0) {
    return params.resolvedMedia
  }

  const blockMedia: PostRenderMediaItem[] = []

  for (const block of params.blocks) {
    if (block.type === "text") {
      continue
    }

    const mediaId = block.mediaId?.trim() ?? ""

    if (!mediaId) {
      continue
    }

    const mediaItem = params.mediaById.get(mediaId)

    if (!mediaItem) {
      continue
    }

    blockMedia.push(mediaItem)
  }

  return blockMedia
}

function buildNormalizedGroups(params: {
  hasBlocks: boolean
  blocks: PostBlock[]
  blockMedia: PostRenderMediaItem[]
}): PostNormalizedRenderGroup[] {
  if (!params.hasBlocks) {
    return []
  }

  const blockMediaById = new Map<string, PostRenderMediaItem>()

  for (const item of params.blockMedia) {
    const mediaId = item.id?.trim() ?? ""

    if (!mediaId) {
      continue
    }

    blockMediaById.set(mediaId, item)
  }

  const mediaEntryMap = buildMediaEntryMap({
    blocks: params.blocks,
    mediaById: blockMediaById,
  })

  const normalizedGroups: PostNormalizedRenderGroup[] = []
  const visitedCarousel = new Set<string>()
  const carouselBlockMap = new Map<string, PostBlock[]>()

  for (const block of params.blocks) {
    const groupId = block.editorState?.carousel?.groupId

    if (!groupId) {
      continue
    }

    const currentGroup = carouselBlockMap.get(groupId) ?? []
    currentGroup.push(block)
    carouselBlockMap.set(groupId, currentGroup)
  }

  for (let i = 0; i < params.blocks.length; i++) {
    const block = params.blocks[i]

    if (block.type === "text") {
      normalizedGroups.push({
        type: "text",
        block,
      })
      continue
    }

    const carouselMeta = block.editorState?.carousel

    if (carouselMeta?.groupId) {
      const groupId = carouselMeta.groupId

      if (visitedCarousel.has(groupId)) {
        continue
      }

      visitedCarousel.add(groupId)

      const blocks = (carouselBlockMap.get(groupId) ?? []).sort((a, b) => {
        const aIndex = a.editorState?.carousel?.index ?? 0
        const bIndex = b.editorState?.carousel?.index ?? 0
        return aIndex - bIndex
      })

      const mediaEntries: PostRenderMediaEntry[] = []

      for (const groupedBlock of blocks) {
        const mediaId = groupedBlock.mediaId?.trim() ?? ""
        if (!mediaId) continue

        const mediaItem = blockMediaById.get(mediaId)
        if (!mediaItem) continue

        mediaEntries.push({
          media: mediaItem,
          block: mediaEntryMap.get(mediaId),
        })
      }

      if (mediaEntries.length === 0) {
        continue
      }

      normalizedGroups.push({
        type: "media",
        variant: "carousel",
        blocks,
        mediaEntries,
      })

      continue
    }

    const mediaId = block.mediaId?.trim() ?? ""
    const mediaItem = mediaId ? blockMediaById.get(mediaId) : undefined

    if (!mediaItem) {
      continue
    }

    normalizedGroups.push({
      type: "media",
      variant: "single",
      blocks: [block],
      mediaEntries: [
        {
          media: mediaItem,
          block: mediaEntryMap.get(mediaId),
        },
      ],
    })
  }

  return normalizedGroups
}

function buildLockedPreviewText(params: {
  normalizedGroups: PostNormalizedRenderGroup[]
  fallbackText: string
}): string {
  if (params.normalizedGroups.length === 0) {
    return params.fallbackText
  }

  return params.normalizedGroups
    .filter((group) => group.type === "text")
    .map((group) => normalizeText(group.block.content))
    .filter(Boolean)
    .join("\n\n")
}

function buildPrimaryLockedPreviewMedia(params: {
  normalizedGroups: PostNormalizedRenderGroup[]
  fallbackMedia: PostRenderMediaItem[]
}): PostRenderMediaItem | null {
  for (const group of params.normalizedGroups) {
    if (group.type !== "media") {
      continue
    }

    const primaryMedia = group.mediaEntries[0]?.media

    if (primaryMedia) {
      return primaryMedia
    }
  }

  return params.fallbackMedia[0] ?? null
}

export function buildPostRenderInput(
  params: BuildPostRenderInputParams
): PostRenderInput {
  const blocks = params.blocks ?? []
  const hasBlocks = blocks.length > 0

  const { resolvedMedia, mediaById } = buildResolvedMediaContext({
    media: params.media,
  })

  const blockText = buildBlockText({
    hasBlocks,
    blocks,
    text: params.text,
  })

  const blockMedia = buildBlockMedia({
    hasBlocks,
    blocks,
    mediaById,
    resolvedMedia,
  })

  const normalizedGroups = buildNormalizedGroups({
    hasBlocks,
    blocks,
    blockMedia,
  })

  const lockedPreviewText = buildLockedPreviewText({
    normalizedGroups,
    fallbackText: blockText,
  })

  const primaryLockedPreviewMedia = buildPrimaryLockedPreviewMedia({
    normalizedGroups,
    fallbackMedia: blockMedia,
  })

  const mediaBlockMap = buildMediaEntryMap({
    blocks,
    mediaById,
  })

  const resolvedMediaEntries = blockMedia.map((item) => ({
    media: item,
    block: item.id ? mediaBlockMap.get(item.id) : undefined,
  }))

  return {
    hasBlocks,
    resolvedMedia,
    normalizedGroups,
    blockText,
    blockMedia,
    resolvedMediaEntries,
    lockedPreviewText,
    primaryLockedPreviewMedia,
  }
}
