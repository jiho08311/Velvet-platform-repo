import { localDateTimeToUtcIso } from "@/shared/lib/date-time"

import type {
  CreateOrEditPostFormBlock,
  CreatePostDraftStatus,
  CreatePostUploadedMediaInput,
  NormalizedCreatePostDraftIntent,
  PostVisibility,
} from "../types"

type NormalizeCreatePostActionInput = {
  creatorId: string
  title?: string | null
  status?: CreatePostDraftStatus
  publishedAt?: string | null
  visibility: PostVisibility
  price?: number
  blocks?: CreateOrEditPostFormBlock[]
}

type NormalizeFeedCreatePostInput = {
  creatorId: string
  text: string
  visibility: Extract<PostVisibility, "public" | "subscribers">
  files?: CreatePostUploadedMediaInput[]
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

function normalizeCreateBlocks(
  blocks: CreateOrEditPostFormBlock[] | undefined
): CreateOrEditPostFormBlock[] {
  return (blocks ?? []).map((block) => {
    if (block.type === "text") {
      return {
        ...block,
        content: normalizeText(block.content),
      }
    }

    return block
  })
}

function buildQuickCreateBlocks(params: {
  text: string
  files: CreatePostUploadedMediaInput[]
}): CreateOrEditPostFormBlock[] {
  const trimmedText = normalizeText(params.text)
  const blocks: CreateOrEditPostFormBlock[] = []

  if (trimmedText) {
    blocks.push({
      type: "text",
      content: trimmedText,
      sortOrder: 0,
    })
  }

  params.files.forEach((file, index) => {
    blocks.push({
      type: file.type,
      sortOrder: trimmedText ? index + 1 : index,
      media: {
        kind: "uploaded",
        uploaded: file,
      },
      content: null,
    })
  })

  return blocks
}

function normalizePublishedAt(params: {
  status: CreatePostDraftStatus
  publishedAt?: string | null
}): string | null {
  if (params.status !== "scheduled") {
    return null
  }

  const normalizedPublishedAt = localDateTimeToUtcIso(params.publishedAt)

  if (!normalizedPublishedAt) {
    throw new Error("Scheduled post requires valid publishedAt")
  }

  return normalizedPublishedAt
}

function normalizePrice(params: {
  visibility: PostVisibility
  price?: number
}): number {
  const normalizedPrice = params.price ?? 0

  if (params.visibility === "paid") {
    if (normalizedPrice <= 0) {
      throw new Error("Paid post price must be greater than 0")
    }

    return normalizedPrice
  }

  return 0
}

function assertCreateDraftHasContent(blocks: CreateOrEditPostFormBlock[]) {
  const hasContent = blocks.some((block) => {
    if (block.type === "text") {
      return block.content.length > 0
    }

    if (block.type === "carousel") {
      return block.items.length > 0
    }

    return true
  })

  if (!hasContent) {
    throw new Error("Post must have text or media")
  }
}

export function normalizeCreatePostDraftIntent(
  input: NormalizeCreatePostActionInput
): NormalizedCreatePostDraftIntent {
  const status = input.status ?? "published"
  const blocks = normalizeCreateBlocks(input.blocks)

  assertCreateDraftHasContent(blocks)

  return {
    creatorId: input.creatorId,
    title: input.title ?? null,
    visibility: input.visibility,
    price: normalizePrice({
      visibility: input.visibility,
      price: input.price,
    }),
    status,
    publishedAt: normalizePublishedAt({
      status,
      publishedAt: input.publishedAt,
    }),
    blocks,
  }
}

export function normalizeFeedCreatePostDraftIntent(
  input: NormalizeFeedCreatePostInput
): NormalizedCreatePostDraftIntent {
  const files = input.files ?? []
  const blocks = buildQuickCreateBlocks({
    text: input.text,
    files,
  })

  if (blocks.length === 0) {
    throw new Error("Empty post")
  }

  return {
    creatorId: input.creatorId,
    visibility: input.visibility,
    price: 0,
    status: "published",
    publishedAt: null,
    blocks,
  }
}
