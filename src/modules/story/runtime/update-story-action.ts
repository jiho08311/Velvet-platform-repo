// src/modules/story/runtime/update-story-action.ts
"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/public/get-creator-by-user-id"
import type { StoryEditorState } from "../types"
import { createMediaAssetRuntime } from "@/modules/media/public/create-media-asset-runtime"
import { createStoryMediaBinding } from "@/modules/media/public/story-media-binding"
import {
  findActiveStoryOwnership,
  updateStoryRow,
} from "@/modules/story/repositories/story-repository"

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

type UpdateStoryActionInput = {
  storyId: string
  text?: string
  storagePath?: string | null
  editorState?: StoryEditorState | null
}

function resolveStoryMediaType(storagePath: string): "image" | "video" {
  const lower = storagePath.toLowerCase()

  if (
    lower.endsWith(".mp4") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".m4v")
  ) {
    return "video"
  }

  return "image"
}

async function writeStoryMediaBinding(input: {
  storyId: string
  ownerUserId: string
  storagePath: string
}) {
  const asset = await createMediaAssetRuntime({
    ownerUserId: input.ownerUserId,
    mediaType: resolveStoryMediaType(input.storagePath),
    mimeType: null,
    storageBucket: MEDIA_BUCKET,
    storagePath: input.storagePath,
    processingStatus: "ready",
    sourceSurface: "update_story_media_new_authority",
  })

  await createStoryMediaBinding({
    storyId: input.storyId,
    mediaId: asset.id,
    bindingRole: "primary",
  })
}

export async function updateStoryAction({
  storyId,
  text,
  storagePath,
  editorState,
}: UpdateStoryActionInput): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    throw new Error("Creator not found")
  }

  const resolvedStoryId = storyId.trim()

  if (!resolvedStoryId) {
    throw new Error("Story id is required")
  }

  const existing = await findActiveStoryOwnership(resolvedStoryId)

  if (!existing) {
    throw new Error("Story not found")
  }

  if (existing.creator_id !== creator.id) {
    throw new Error("Forbidden")
  }

  const nextText = typeof text === "string" ? text.trim() || null : undefined
  const nextStoragePath =
    typeof storagePath === "string" ? storagePath.trim() || null : undefined
  const nextEditorState =
    typeof editorState === "undefined" ? undefined : editorState

  const updatePayload: {
    text?: string | null
    storage_path?: string
    editor_state?: StoryEditorState | null
  } = {}

  if (typeof nextText !== "undefined") {
    updatePayload.text = nextText
  }

  if (typeof nextStoragePath !== "undefined" && nextStoragePath) {
    updatePayload.storage_path = nextStoragePath
  }

  if (typeof nextEditorState !== "undefined") {
    updatePayload.editor_state = nextEditorState
  }

  if (Object.keys(updatePayload).length === 0) {
    return
  }

  await updateStoryRow({
    storyId: resolvedStoryId,
    updatePayload,
  })

  if (nextStoragePath) {
    await writeStoryMediaBinding({
      storyId: resolvedStoryId,
      ownerUserId: user.id,
      storagePath: nextStoragePath,
    })
  }

  revalidatePath("/feed")
}
