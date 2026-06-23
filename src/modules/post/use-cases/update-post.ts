// src/modules/post/use-cases/update-post.ts

import { updatePost } from "@/modules/post/public/update-post-row"
import { updatePostStatus } from "@/modules/post/public/update-post-status"
import { createMedia } from "@/modules/media/public/create-media"
import { uploadMediaFile as uploadMedia } from "@/modules/media/public/upload-media-file"
import {
  applyModerationOutcomeToPost,
  requestVideoModeration,
} from "@/modules/governance/public/moderation-governance-contract"
import { resolvePostMutationModerationOutcome } from "@/modules/post/services/post-mutation-moderation-service"
import {
  deletePostMediaRowsByIds,
  findPostMediaModerationStatusesByPostId,
} from "@/modules/media/public/get-post-media-bindings"
import { replaceCanonicalPostBlocksForPost } from "@/modules/post/repositories/post-canonical-write-repository"
import type { EditPostPlan } from "@/modules/post/services/post-edit-service"
import type { Media } from "@/modules/media/types"

type EditablePostSnapshot = {
  visibility: "public" | "subscribers" | "paid"
  price?: number | null
}

export async function executeUpdatePostUseCase(params: {
  postId: string
  creatorId: string
  userId: string
  currentPost: EditablePostSnapshot
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
        ? params.currentPost.price ?? 0
        : 0,
  })

  if (hasRemovedMedia) {
    await deletePostMediaRowsByIds({
      postId: params.postId,
      mediaIds: removedMediaIds,
    })
  }

  const createdMedia: Media[] = []

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
    await requestVideoModeration({
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

    await applyModerationOutcomeToPost({
      postId: params.postId,
      outcome,
    })
  }

  await replaceCanonicalPostBlocksForPost({
    postId: params.postId,
    blocks: persistedBlocks.map((block) => ({
      post_id: params.postId,
      type: block.type,
      content: block.content ?? null,
      media_id: block.mediaId ?? null,
      sort_order: block.sortOrder,
      editor_state: block.editorState ?? null,
    })),
  })
}
