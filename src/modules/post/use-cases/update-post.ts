// src/modules/post/use-cases/update-post.ts

import { updatePost } from "@/modules/post/public/update-post-row"
import { updatePostStatus } from "@/modules/post/public/update-post-status"
import { createMedia } from "@/modules/media/public/create-media"
import { uploadMediaFile as uploadMedia } from "@/modules/media/public/upload-media-file"
import { enqueueVideoModeration } from "@/modules/moderation/server/enqueue-video-moderation"
import { applyVideoModerationOutcome } from "@/modules/moderation/server/apply-video-moderation-outcome"
import { resolvePostMutationModerationOutcome } from "@/modules/post/services/post-mutation-moderation-service"
import {
  deletePostMediaRowsByIds,
  findPostMediaModerationStatusesByPostId,
} from "@/modules/post/repositories/post-media-repository"
import {
  deletePostBlocksByPostId,
  insertPostBlocks,
} from "@/modules/post/repositories/post-block-repository"
import type { EditPostPlan } from "@/modules/post/services/post-edit-service"

export async function executeUpdatePostUseCase(params: {
  postId: string
  creatorId: string
  userId: string
  currentPost: any
  plan: EditPostPlan
}) {
  const {
    normalized,
    validFiles,
    shouldReenter,
    isRemoveOnly,
    persistedBlocks,
    removedMediaIds,
    hasRemovedMedia,
    hasNewMedia,
    publishIntent,
  } = params.plan

  await updatePost({
    postId: params.postId,
    creatorId: params.creatorId,
    content: normalized.content,
    visibility: params.currentPost.visibility,
    price:
      params.currentPost.visibility === "paid"
        ? params.currentPost.price
        : 0,
  })

  if (hasRemovedMedia) {
    await deletePostMediaRowsByIds({
      postId: params.postId,
      mediaIds: removedMediaIds,
    })
  }

  const createdMedia: any[] = []

  if (hasNewMedia) {
    for (const file of validFiles) {
      const storagePath = await uploadMedia({
        uploaderUserId: params.userId,
        file,
      })

      const media = await createMedia({
        postId: params.postId,
        ownerUserId: params.userId,
        type: "image",
        storagePath,
        useInitialModerationState: true,
      })

      if (media.type === "video") {
        createdMedia.push(media)
      }
    }
  }

  if (shouldReenter) {
    await updatePostStatus({
      postId: params.postId,
      outcome: "pending",
      clearRejectionReason: true,
    })
  }

  if (hasNewMedia && createdMedia.length > 0) {
    await enqueueVideoModeration({
      postId: params.postId,
      publishIntent,
      media: createdMedia,
    })
  }

  if (isRemoveOnly) {
    const data = await findPostMediaModerationStatusesByPostId(params.postId)

    const outcome = resolvePostMutationModerationOutcome({
      statuses: data.map((i) => i.moderation_status),
    })

    await applyVideoModerationOutcome({
      postId: params.postId,
      outcome,
    })
  }

  await deletePostBlocksByPostId(params.postId)

  if (persistedBlocks.length > 0) {
    await insertPostBlocks(
      persistedBlocks.map((b) => ({
        post_id: params.postId,
        type: b.type,
        content: b.content ?? null,
        media_id: b.mediaId ?? null,
        sort_order: b.sortOrder,
        editor_state: b.editorState ?? null,
      }))
    )
  }
}
