import type {
  PostBlock,
  PostRenderGroup,
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

function buildMediaEntryMap(params: {
  blocks: PostBlock[]
  resolvedMedia: PostRenderMediaItem[]
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

    const matchedMedia = params.resolvedMedia.find((item) => item.id === mediaId)

    if (!matchedMedia) {
      continue
    }

    map.set(mediaId, block)
  }

  return map
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

function buildResolvedMedia(params: {
  media?: PostRenderMediaItem[]
}): PostRenderMediaItem[] {
  return params.media ?? []
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
  resolvedMedia: PostRenderMediaItem[]
}): PostRenderMediaItem[] {
  if (!params.hasBlocks || params.resolvedMedia.length === 0) {
    return params.resolvedMedia
  }

  return params.blocks
    .filter(
      (block) =>
        block.type !== "text" &&
        block.mediaId &&
        params.resolvedMedia.some((item) => item.id === block.mediaId)
    )
    .map((block) =>
      params.resolvedMedia.find((item) => item.id === block.mediaId)
    )
    .filter((item): item is PostRenderMediaItem => Boolean(item))
}

function buildGroupedBlocks(params: {
  hasBlocks: boolean
  blocks: PostBlock[]
  blockMedia: PostRenderMediaItem[]
}): PostRenderGroup[] {
  if (!params.hasBlocks) {
    return []
  }

  const mediaEntryMap = buildMediaEntryMap({
    blocks: params.blocks,
    resolvedMedia: params.blockMedia,
  })

  const groupedBlocks: PostRenderGroup[] = []
  const visitedCarousel = new Set<string>()

  for (let i = 0; i < params.blocks.length; i++) {
    const block = params.blocks[i]

    if (block.type === "text") {
      groupedBlocks.push({
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

      const blocks = params.blocks
        .filter((candidate) => candidate.editorState?.carousel?.groupId === groupId)
        .sort((a, b) => {
          const aIndex = a.editorState?.carousel?.index ?? 0
          const bIndex = b.editorState?.carousel?.index ?? 0
          return aIndex - bIndex
        })

      const mediaEntries: PostRenderMediaEntry[] = []

      for (const groupedBlock of blocks) {
        const mediaId = groupedBlock.mediaId?.trim() ?? ""
        if (!mediaId) continue

        const mediaItem = params.blockMedia.find((item) => item.id === mediaId)
        if (!mediaItem) continue

        mediaEntries.push({
          media: mediaItem,
          block: mediaEntryMap.get(mediaId),
        })
      }

      if (mediaEntries.length === 0) {
        continue
      }

      groupedBlocks.push({
        type: "carousel",
        blocks,
        mediaItems: mediaEntries.map((entry) => entry.media),
        mediaEntries,
      })

      continue
    }

    const mediaId = block.mediaId?.trim() ?? ""
    const mediaItem = mediaId
      ? params.blockMedia.find((item) => item.id === mediaId)
      : undefined

    if (!mediaItem) {
      continue
    }

    groupedBlocks.push({
      type: "media",
      blocks: [block],
      mediaItems: [mediaItem],
      mediaEntries: [
        {
          media: mediaItem,
          block: mediaEntryMap.get(mediaId),
        },
      ],
    })
  }

  return groupedBlocks
}

export function buildPostRenderInput(params: BuildPostRenderInputParams) {
  const blocks = params.blocks ?? []
  const hasBlocks = blocks.length > 0

  const resolvedMedia = buildResolvedMedia({
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
    resolvedMedia,
  })

  const groupedBlocks = buildGroupedBlocks({
    hasBlocks,
    blocks,
    blockMedia,
  })

  const lockedPreviewText = blockText

  const primaryLockedPreviewMedia =
    blockMedia.length > 0 ? blockMedia[0] : null

  const mediaBlockMap = buildMediaEntryMap({
    blocks,
    resolvedMedia: blockMedia,
  })

  const resolvedMediaEntries = blockMedia.map((item) => ({
    media: item,
    block: item.id ? mediaBlockMap.get(item.id) : undefined,
  }))

  return {
    hasBlocks,
    resolvedMedia,
    blockText,
    blockMedia,
    groupedBlocks,
    resolvedMediaEntries,
    lockedPreviewText,
    primaryLockedPreviewMedia,
  }
}