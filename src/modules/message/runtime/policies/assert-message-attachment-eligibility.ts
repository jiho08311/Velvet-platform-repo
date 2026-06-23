import {
  getMessageAttachmentEligibilityRowsByIds,
} from "@/modules/media/public/get-message-attachment-media"
import { assertCanSendMessage } from "@/modules/message/runtime/policies/assert-can-send-message"
import { isModerationApproved } from "@/modules/moderation/public/moderation-outcome-policy"

type AssertMessageAttachmentEligibilityInput = {
  conversationId: string
  senderId: string
  mediaIds?: string[]
}

type AssertMessageAttachmentEligibilityResult = {
  otherUserId: string
  mediaIds: string[]
}

export async function assertMessageAttachmentEligibility({
  conversationId,
  senderId,
  mediaIds = [],
}: AssertMessageAttachmentEligibilityInput): Promise<AssertMessageAttachmentEligibilityResult> {
  const { otherUserId } = await assertCanSendMessage({
    conversationId,
    senderId,
  })

  const resolvedMediaIds = Array.from(
    new Set(
      mediaIds
        .map((mediaId) => mediaId?.trim())
        .filter((mediaId): mediaId is string => Boolean(mediaId))
    )
  )

  if (resolvedMediaIds.length === 0) {
    return {
      otherUserId,
      mediaIds: [],
    }
  }

  const mediaRows = await getMessageAttachmentEligibilityRowsByIds(
    resolvedMediaIds
  )

  if (mediaRows.length !== resolvedMediaIds.length) {
    throw new Error("Some media files were not found")
  }

  const mediaById = new Map(mediaRows.map((media) => [media.id, media]))

  for (const mediaId of resolvedMediaIds) {
    const media = mediaById.get(mediaId)

    if (!media) {
      throw new Error("Some media files were not found")
    }

    if (media.owner_user_id !== senderId) {
      throw new Error("Unauthorized")
    }

    if (media.post_id) {
      throw new Error("Invalid message attachment")
    }

    if (media.message_id) {
      throw new Error("Invalid message attachment")
    }

    if (media.status && media.status !== "ready") {
      throw new Error("Invalid message attachment")
    }

    if (media.processing_status && media.processing_status !== "ready") {
      throw new Error("Invalid message attachment")
    }

    if (
      media.moderation_status &&
      !isModerationApproved(media.moderation_status)
    ) {
      throw new Error("Invalid message attachment")
    }
  }

  return {
    otherUserId,
    mediaIds: resolvedMediaIds,
  }
}
