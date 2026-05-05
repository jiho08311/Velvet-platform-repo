// src/modules/post/services/post-edit-service.ts

import {
  buildSubmittedEditPostDraft,
  buildNormalizedEditPostUpdateDraft,
  projectPersistedEditBlocksFromDraft,
  shouldReenterPostModerationOnEdit,
} from "@/modules/post/policies/post-edit-policy"
import type { CreatePostClientDraftBlock } from "../types"

export type BuildEditPostPlanInput = {
  currentBlocks: any[]
  nextBlocks: CreatePostClientDraftBlock[]
  files: File[]
  price: number
  visibility: "public" | "subscribers" | "paid"
  currentStatus: string
}

export function resolveMediaType(file: File): "image" | "video" | "audio" | "file" {
  const mime = file.type || ""

  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("audio/")) return "audio"

  return "file"
}

export function buildEditPostPlan(input: BuildEditPostPlanInput) {
  const currentDraft = {
    blocks: input.currentBlocks,
  }

  const uploadedFilesForDraft = input.files
    .filter((file) => file instanceof File && file.size > 0)
    .map((file) => ({
      path: `__edit-upload__/${file.name}-${file.size}-${file.lastModified}`,
      type: resolveMediaType(file),
      mimeType: file.type || "",
      size: file.size,
      originalName: file.name,
    }))

  const submittedDraft = buildSubmittedEditPostDraft({
    blocks: input.nextBlocks,
    uploadedFiles: uploadedFilesForDraft,
  })

  const normalized = buildNormalizedEditPostUpdateDraft({
    current: currentDraft,
    next: submittedDraft,
  })

  if (input.visibility === "paid" && input.price <= 0) {
    throw new Error("Paid post price must be greater than 0")
  }

  const validFiles = input.files.filter(
    (file) => file instanceof File && file.size > 0
  )

  if (normalized.media.uploadedMedia.length !== validFiles.length) {
    throw new Error("Uploaded media does not match submitted blocks")
  }

  const shouldReenter = shouldReenterPostModerationOnEdit(
    normalized.comparison
  )

  const persistedBlocks = projectPersistedEditBlocksFromDraft(normalized)

  const publishIntent: "published" | "scheduled" =
    input.currentStatus === "scheduled" ? "scheduled" : "published"

  return {
    normalized,
    validFiles,
    shouldReenter,
    isRemoveOnly: normalized.isRemoveOnlyMutation,
    persistedBlocks,
    removedMediaIds: normalized.media.removedExistingMediaIds,
    hasRemovedMedia: normalized.media.hasRemovedMedia,
    hasNewMedia: normalized.media.hasNewMedia,
    publishIntent,
  }
}

export type EditPostPlan = ReturnType<typeof buildEditPostPlan>