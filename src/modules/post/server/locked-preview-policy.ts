// src/modules/post/server/locked-preview-policy.ts

import type { PostBlockEditorState, PostRenderMediaItem } from "../types"

export type LockedPreviewPolicyAccess = {
  canView: boolean
  locked: boolean
  lockReason: "none" | "subscription" | "purchase"
}

export type LockedPreviewPolicyPublicState = "hidden" | "upcoming" | "published"

export type LockedPreviewRenderableMediaItem = PostRenderMediaItem

export type LockedPreviewRenderableBlock = {
  id: string
  postId: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  mediaId: string | null
  sortOrder: number
  createdAt: string
  editorState: PostBlockEditorState | null
}

type BuildLockedPreviewPolicyInput = {
  access: LockedPreviewPolicyAccess
  publicState: LockedPreviewPolicyPublicState
  text: string
  blocks?: LockedPreviewRenderableBlock[]
  media?: LockedPreviewRenderableMediaItem[]
}

export type LockedPreviewPolicyResult = {
  canViewFullContent: boolean
  shouldHideFullContent: boolean
  shouldRenderLockedPreview: boolean
  previewVariant: "none" | "subscription" | "purchase"
  lockReason: LockedPreviewPolicyAccess["lockReason"]
  renderTextSeed: string
  previewBlocks: LockedPreviewRenderableBlock[]
  previewMedia: LockedPreviewRenderableMediaItem[]
  allowPreviewMediaSigning: boolean
}

const LOCKED_PREVIEW_MEDIA_LIMIT = 1

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

function sortBlocks(blocks: LockedPreviewRenderableBlock[]) {
  return [...blocks].sort((a, b) => a.sortOrder - b.sortOrder)
}

function sortMedia(media: LockedPreviewRenderableMediaItem[]) {
  return [...media].sort((a, b) => {
    const aOrder = a.sortOrder ?? 0
    const bOrder = b.sortOrder ?? 0
    return aOrder - bOrder
  })
}

function isTextBlock(
  block: LockedPreviewRenderableBlock
): block is LockedPreviewRenderableBlock & { type: "text" } {
  return block.type === "text"
}

function pickLockedPreviewBlocks(
  blocks: LockedPreviewRenderableBlock[]
): LockedPreviewRenderableBlock[] {
  const sorted = sortBlocks(blocks)

  const textBlocks = sorted.filter(
    (block) => isTextBlock(block) && normalizeText(block.content).length > 0
  )

  if (textBlocks.length > 0) {
    return textBlocks
  }

  const firstMediaBlock = sorted.find((block) => block.type !== "text")

  return firstMediaBlock ? [firstMediaBlock] : []
}

function pickLockedPreviewMedia(
  media: LockedPreviewRenderableMediaItem[]
): LockedPreviewRenderableMediaItem[] {
  return sortMedia(media).slice(0, LOCKED_PREVIEW_MEDIA_LIMIT)
}

function resolvePreviewVariant(
  access: LockedPreviewPolicyAccess
): LockedPreviewPolicyResult["previewVariant"] {
  if (access.canView || !access.locked || access.lockReason === "none") {
    return "none"
  }

  return access.lockReason
}

export function buildLockedPreviewPolicy(
  input: BuildLockedPreviewPolicyInput
): LockedPreviewPolicyResult {
  const blocks = input.blocks ?? []
  const media = input.media ?? []
  const previewVariant = resolvePreviewVariant(input.access)

  if (input.access.canView && !input.access.locked) {
    return {
      canViewFullContent: true,
      shouldHideFullContent: false,
      shouldRenderLockedPreview: false,
      previewVariant: "none",
      lockReason: "none",
      renderTextSeed: normalizeText(input.text),
      previewBlocks: sortBlocks(blocks),
      previewMedia: sortMedia(media),
      allowPreviewMediaSigning: false,
    }
  }

  if (input.publicState === "hidden") {
    return {
      canViewFullContent: false,
      shouldHideFullContent: true,
      shouldRenderLockedPreview: false,
      previewVariant,
      lockReason: input.access.lockReason,
      renderTextSeed: "",
      previewBlocks: [],
      previewMedia: [],
      allowPreviewMediaSigning: false,
    }
  }

  const previewBlocks = pickLockedPreviewBlocks(blocks)
  const previewMedia = pickLockedPreviewMedia(media)

  const previewTextSeed =
    previewBlocks.length > 0
      ? previewBlocks
          .filter(isTextBlock)
          .map((block) => normalizeText(block.content))
          .filter(Boolean)
          .join("\n\n")
      : normalizeText(input.text)

  return {
    canViewFullContent: false,
    shouldHideFullContent: true,
    shouldRenderLockedPreview: previewVariant !== "none",
    previewVariant,
    lockReason: input.access.lockReason,
    renderTextSeed: previewTextSeed,
    previewBlocks,
    previewMedia,
    allowPreviewMediaSigning: previewMedia.length > 0,
  }
}