"use server"

import {
  shouldReenterPostModerationOnEdit,
} from "@/modules/post/server/post-edit-moderation-reentry-policy"
import {
  buildInitialEditPostDraft,
  buildSubmittedEditPostDraft,
  buildEditPostModerationComparisonInput,
  deriveEditPostContentFromDraft,
  extractRemovedExistingMediaIdsFromEditDraft,
  extractUploadedMediaFromEditDraft,
  isRemoveOnlyEditDraftMutation,
  projectPersistedEditBlocksFromDraft,
} from "@/modules/post/server/edit-post-draft-policy"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import type { PostBlockEditorState } from "../types"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { createMedia } from "@/modules/media/server/create-media"
import { uploadMedia } from "@/modules/media/server/upload-media"
import { enqueueVideoModeration } from "@/modules/moderation/server/enqueue-video-moderation"
import { applyVideoModerationOutcome } from "@/modules/moderation/server/apply-video-moderation-outcome"
import { getCreatorStudioPost } from "@/modules/post/server/get-creator-studio-post"
import { resolvePostMutationModerationOutcome } from "@/modules/post/server/resolve-post-mutation-moderation-outcome"
import { updatePost } from "@/modules/post/server/update-post"
import { updatePostStatus } from "@/modules/post/server/update-post-status"
import OpenAI from "openai"

type UpdatePostActionInput = {
  postId: string
  visibility: "public" | "subscribers" | "paid"
  price?: number
  files?: File[]
 blocks?: import("../types").CreatePostDraftBlock[]
}

type MediaRow = {
  id: string
  storage_path: string
}

type EnqueuedVideoMedia = {
  id: string
  type: "image" | "video" | "audio" | "file"
  storagePath: string
}

type MediaModerationStatusRow = {
  moderation_status: string | null
}

function resolveMediaType(file: File): "image" | "video" | "audio" | "file" {
  const mime = file.type || ""

  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("audio/")) return "audio"

  return "file"
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function checkUploadedImageSafety(file: File) {
  if (!(file instanceof File)) {
    throw new Error("Image file is required")
  }

  if (!file.type.startsWith("image/")) return

  for (const delay of [0, 800, 1600]) {
    if (delay > 0) await sleep(delay)

    try {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")

      const response = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: [
          {
            type: "image_url",
            image_url: {
              url: `data:${file.type};base64,${base64}`,
            },
          },
        ],
      })

      const result = response.results?.[0]

      if (!result) {
        throw new Error("Failed to moderate image")
      }

      if (result.flagged) {
        throw new Error("IMAGE_BLOCKED")
      }

      return
    } catch (error: any) {
      if (error?.status !== 429) throw error
    }
  }

  throw new Error("Image moderation temporarily unavailable")
}

export async function updatePostAction({
  postId,
  visibility: _visibility,
  price = 0,
  files = [],
  blocks = [],
}: UpdatePostActionInput) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/sign-in?next=/post/${postId}/edit`)
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    throw new Error("Creator not found")
  }

  const currentPost = await getCreatorStudioPost({
    postId,
    creatorId: creator.id,
  })

  if (!currentPost) {
    throw new Error("Post not found")
  }

 const currentDraft = {
  blocks: currentPost.blocks,
}

  const uploadedFilesForDraft = files
    .filter((file) => file instanceof File && file.size > 0)
    .map((file) => ({
      path: `__edit-upload__/${file.name}-${file.size}-${file.lastModified}`,
      type: resolveMediaType(file),
      mimeType: file.type || "",
      size: file.size,
      originalName: file.name,
    }))

  const submittedDraft = buildSubmittedEditPostDraft({
    blocks,
    uploadedFiles: uploadedFilesForDraft,
  })

  const nextContent = deriveEditPostContentFromDraft(submittedDraft)

  if (currentPost.visibility === "paid" && price <= 0) {
    throw new Error("Paid post price must be greater than 0")
  }

  await updatePost({
    postId,
    creatorId: creator.id,
    content: nextContent,
    visibility: currentPost.visibility,
    price: currentPost.visibility === "paid" ? price : 0,
  })

  const removedExistingMediaIds = extractRemovedExistingMediaIdsFromEditDraft({
    current: currentDraft,
    next: submittedDraft,
  })

  const hasRemovedMedia = removedExistingMediaIds.length > 0

  if (hasRemovedMedia) {
    const { data: mediaToDelete, error: mediaToDeleteError } = await supabaseAdmin
      .from("media")
      .select("id, storage_path")
      .eq("post_id", postId)
      .in("id", removedExistingMediaIds)
      .returns<MediaRow[]>()

    if (mediaToDeleteError) {
      throw mediaToDeleteError
    }

    const storagePaths = (mediaToDelete ?? [])
      .map((media) => media.storage_path)
      .filter((path) => typeof path === "string" && path.length > 0)

    if (storagePaths.length > 0) {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

      const { error: storageDeleteError } = await supabaseAdmin.storage
        .from(bucket)
        .remove(storagePaths)

      if (storageDeleteError) {
        throw storageDeleteError
      }
    }

    const { error: deleteMediaRowsError } = await supabaseAdmin
      .from("media")
      .delete()
      .eq("post_id", postId)
      .in("id", removedExistingMediaIds)

    if (deleteMediaRowsError) {
      throw deleteMediaRowsError
    }
  }

  const validFiles = files.filter((file) => file instanceof File && file.size > 0)
  const uploadedDraftMedia = extractUploadedMediaFromEditDraft(submittedDraft)

  if (uploadedDraftMedia.length !== validFiles.length) {
    throw new Error("Uploaded media does not match submitted blocks")
  }

  for (const file of validFiles) {
    if (resolveMediaType(file) === "image") {
      await checkUploadedImageSafety(file)
    }
  }

  const moderationComparison = buildEditPostModerationComparisonInput({
    current: currentDraft,
    next: submittedDraft,
  })

  const shouldReenterModeration = shouldReenterPostModerationOnEdit(
    moderationComparison
  )

  const isRemoveOnlyEdit = isRemoveOnlyEditDraftMutation({
    current: currentDraft,
    next: submittedDraft,
  })

  const createdMediaForModeration: EnqueuedVideoMedia[] = []

  if (moderationComparison.hasNewMedia) {
    const { count, error: countError } = await supabaseAdmin
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId)

    if (countError) {
      throw countError
    }

    const startSortOrder = count ?? 0

    for (const [index, file] of validFiles.entries()) {
      const storagePath = await uploadMedia({
        uploaderUserId: user.id,
        file,
        purpose: "post",
      })

      const createdMedia = await createMedia({
        postId,
        ownerUserId: user.id,
        type: resolveMediaType(file),
        storagePath,
        mimeType: file.type || undefined,
        sortOrder: startSortOrder + index,
        useInitialModerationState: true,
      })

      if (createdMedia.type === "video") {
        createdMediaForModeration.push({
          id: createdMedia.id,
          type: createdMedia.type,
          storagePath: createdMedia.storagePath,
        })
      }
    }
  }

  if (shouldReenterModeration) {
    await updatePostStatus({
      postId,
      outcome: "pending",
      clearRejectionReason: true,
    })
  }

  const hasVideoToModerate = createdMediaForModeration.length > 0

  if (moderationComparison.hasNewMedia && hasVideoToModerate) {
    await enqueueVideoModeration({
      postId,
      publishIntent: currentPost.status === "scheduled" ? "scheduled" : "published",
      media: createdMediaForModeration,
    })
  }

  if (isRemoveOnlyEdit) {
    const { data: remainingMediaStatuses, error: remainingMediaStatusesError } =
      await supabaseAdmin
        .from("media")
        .select("moderation_status")
        .eq("post_id", postId)
        .returns<MediaModerationStatusRow[]>()

    if (remainingMediaStatusesError) {
      throw remainingMediaStatusesError
    }

    const outcome = resolvePostMutationModerationOutcome({
      statuses: (remainingMediaStatuses ?? []).map(
        (item) => item.moderation_status
      ),
    })

    await applyVideoModerationOutcome({
      postId,
      outcome,
      ...(outcome === "approved"
        ? {
            publishIntent:
              currentPost.status === "scheduled" ? "scheduled" : "published",
          }
        : {}),
      clearRejectionReason: outcome !== "rejected",
    })
  }

  await supabaseAdmin
    .from("post_blocks")
    .delete()
    .eq("post_id", postId)

const persistedBlocks = projectPersistedEditBlocksFromDraft(submittedDraft)

if (persistedBlocks.length > 0) {
  const insertData = persistedBlocks.map((block) => ({
    post_id: postId,
    type: block.type,
    content: block.content ?? null,
    media_id: block.mediaId ?? null,
    sort_order: block.sortOrder,
    editor_state: block.editorState ?? null,
  }))

    const { error: insertBlocksError } = await supabaseAdmin
      .from("post_blocks")
      .insert(insertData)

    if (insertBlocksError) {
      throw insertBlocksError
    }
  }

  revalidatePath("/feed")
  revalidatePath(`/post/${postId}`)
  revalidatePath(`/post/${postId}/edit`)
  revalidatePath(`/creator/${creator.username}`)
  revalidatePath("/profile")

  redirect(`/post/${postId}`)
}