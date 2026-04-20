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

type PostRenderMediaGroupEntry = {
  mediaItems: PostRenderMediaItem[]
  mediaEntries: PostRenderMediaEntry[]
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

  let currentMediaBlocks: PostBlock[] = []
  let currentMediaEntries: PostRenderMediaEntry[] = []

  const pushMediaGroup = () => {
    if (currentMediaBlocks.length === 0) {
      return
    }

    groupedBlocks.push({
      type: "media",
      blocks: currentMediaBlocks,
      mediaItems: currentMediaEntries.map((entry) => entry.media),
      mediaEntries: currentMediaEntries,
    })

    currentMediaBlocks = []
    currentMediaEntries = []
  }

  for (const block of params.blocks) {
    if (block.type === "text") {
      pushMediaGroup()

      groupedBlocks.push({
        type: "text",
        block,
      })

      continue
    }

    const mediaId = block.mediaId?.trim() ?? ""
    const mediaItem = mediaId
      ? params.blockMedia.find((item) => item.id === mediaId)
      : undefined

    currentMediaBlocks.push(block)

    if (mediaItem) {
      currentMediaEntries.push({
        media: mediaItem,
        block: mediaEntryMap.get(mediaId),
      })
    }
  }

  pushMediaGroup()

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