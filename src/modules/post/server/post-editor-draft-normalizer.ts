import type {
  CreateOrEditPostFormBlock,
  CreatePostUploadedMediaInput,
  PersistedPostEditorBlockInput,
  PostBlock,
  PostBlockEditorState,
  PostEditorCarouselItem,
  PostEditorMediaType,
} from "../types"

type PersistedMediaBlockInput = PersistedPostEditorBlockInput & {
  type: PostEditorMediaType
}

type PersistedCarouselBucket = {
  groupId: string
  sortOrder: number
  items: Array<{
    index: number
    item: PostEditorCarouselItem<CreatePostUploadedMediaInput>
  }>
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

function isMediaType(
  type: PersistedPostEditorBlockInput["type"]
): type is PostEditorMediaType {
  return (
    type === "image" ||
    type === "video" ||
    type === "audio" ||
    type === "file"
  )
}

function isPersistedMediaBlock(
  block: PersistedPostEditorBlockInput
): block is PersistedMediaBlockInput {
  return isMediaType(block.type)
}

function getCarouselMeta(editorState?: PostBlockEditorState) {
  const groupId = editorState?.carousel?.groupId?.trim()

  if (!groupId) {
    return null
  }

  return {
    groupId,
    index: editorState?.carousel?.index ?? 0,
  }
}

function buildTextDraftBlock(
  block: PersistedPostEditorBlockInput
): Extract<CreateOrEditPostFormBlock, { type: "text" }> | null {
  const content = normalizeText(block.content)

  if (!content) {
    return null
  }

  return {
    type: "text",
    sortOrder: block.sortOrder,
    content,
    editorState: block.editorState ?? null,
  }
}

function buildExistingMediaDraftBlock(
  block: PersistedMediaBlockInput
): Extract<CreateOrEditPostFormBlock, { type: PostEditorMediaType }> | null {
  const mediaId = block.mediaId?.trim()

  if (!mediaId) {
    return null
  }

  return {
    type: block.type,
    sortOrder: block.sortOrder,
    media: {
      kind: "existing",
      mediaId,
    },
    editorState: block.editorState ?? null,
    content: null,
  }
}

function pushCarouselItem(params: {
  buckets: Map<string, PersistedCarouselBucket>
  block: PersistedMediaBlockInput
}) {
  const mediaId = params.block.mediaId?.trim()

  if (!mediaId) {
    return
  }

  const carouselMeta = getCarouselMeta(params.block.editorState)

  if (!carouselMeta) {
    return
  }

  const existingBucket = params.buckets.get(carouselMeta.groupId)
  const bucket =
    existingBucket ??
    {
      groupId: carouselMeta.groupId,
      sortOrder: params.block.sortOrder,
      items: [],
    }

  bucket.sortOrder = Math.min(bucket.sortOrder, params.block.sortOrder)
  bucket.items.push({
    index: carouselMeta.index,
    item: {
      type: params.block.type,
      media: {
        kind: "existing",
        mediaId,
      },
      editorState: params.block.editorState ?? null,
    },
  })

  params.buckets.set(carouselMeta.groupId, bucket)
}

function buildCarouselDraftBlock(
  bucket: PersistedCarouselBucket
): Extract<CreateOrEditPostFormBlock, { type: "carousel" }> | null {
  const items = [...bucket.items]
    .sort((a, b) => a.index - b.index)
    .map(({ item }) => item)

  if (items.length === 0) {
    return null
  }

  return {
    type: "carousel",
    sortOrder: bucket.sortOrder,
    items,
    editorState: null,
    content: null,
  }
}

function normalizePersistedEditorBlockInput(
  block: PostBlock
): PersistedPostEditorBlockInput {
  return {
    type: block.type === "carousel" ? "text" : block.type,
    content: block.content,
    mediaId: block.mediaId,
    sortOrder: block.sortOrder,
    editorState: block.editorState ?? null,
  }
}

/**
 * Persisted post block rows -> normalized editor draft blocks.
 * This keeps edit-time reconstruction policy in one place so create/edit
 * parity does not depend on per-callsite block remapping.
 */
export function buildPostEditorDraftFromPostBlocks(
  blocks: PostBlock[]
): CreateOrEditPostFormBlock[] {
  return buildPostEditorDraftFromPersistedBlocks(
    blocks.map(normalizePersistedEditorBlockInput)
  )
}

/**
 * Persisted post_blocks -> create-compatible editor draft blocks.
 * Existing media identity is preserved via mediaId and carousel grouping
 * is restored from editorState.carousel metadata.
 */
export function buildPostEditorDraftFromPersistedBlocks(
  blocks: PersistedPostEditorBlockInput[]
): CreateOrEditPostFormBlock[] {
  const carouselBuckets = new Map<string, PersistedCarouselBucket>()
  const normalizedBlocks = blocks.flatMap((block): CreateOrEditPostFormBlock[] => {
    if (block.type === "text") {
      const textBlock = buildTextDraftBlock(block)
      return textBlock ? [textBlock] : []
    }

    if (!isPersistedMediaBlock(block)) {
      return []
    }

    const carouselMeta = getCarouselMeta(block.editorState)

    if (carouselMeta) {
      pushCarouselItem({
        buckets: carouselBuckets,
        block,
      })
      return []
    }

    const mediaBlock = buildExistingMediaDraftBlock(block)
    return mediaBlock ? [mediaBlock] : []
  })

  const carouselBlocks = [...carouselBuckets.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((bucket): CreateOrEditPostFormBlock[] => {
      const carouselBlock = buildCarouselDraftBlock(bucket)
      return carouselBlock ? [carouselBlock] : []
    })

  return [...normalizedBlocks, ...carouselBlocks].sort(
    (a, b) => a.sortOrder - b.sortOrder
  )
}
