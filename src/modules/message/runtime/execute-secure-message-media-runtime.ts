import {
  createSecureMessageMediaContract,
  type SecureMessageMediaContract,
} from "@/modules/message/contracts/secure-message-media-contract"
import {
  createConversationMessageMediaMap,
  type MessageMediaRow,
} from "@/modules/message/runtime/services/create-conversation-message-media"
import { requireConversationAccess } from "@/modules/message/runtime/policies/get-conversation-access"
import { findSecureMessageMediaAccessRowByMessageId } from "@/modules/message/repositories/message-read-repository"
import { getMessageMediaRowsByMessageIdOrEmpty } from "@/modules/media/public/get-message-media"
import { verifySecureMessageMediaRuntimeNoThrow } from "@/modules/message/verification/verify-secure-message-media-runtime"
import { shadowEvaluateAccessNoThrow } from "@/modules/entitlement/public/shadow-evaluate-access"
export type ExecuteSecureMessageMediaRuntimeInput = {
  messageId: string
  userId: string
}

export async function executeSecureMessageMediaRuntime({
  messageId,
  userId,
}: ExecuteSecureMessageMediaRuntimeInput): Promise<SecureMessageMediaContract> {
  const message = await findSecureMessageMediaAccessRowByMessageId(messageId)

  if (!message) {
    return createSecureMessageMediaContract({
      items: [],
      messageId,
      viewerUserId: userId,
    })
  }

  const conversationAccess = await requireConversationAccess({
    conversationId: message.conversation_id,
    userId,
  })

  if (message.type === "ppv" && message.sender_id !== userId) {
    await shadowEvaluateAccessNoThrow({
      viewerUserId: userId,
      surface: "message_media",
      subject: {
        type: "message",
        messageId,
        conversationId: message.conversation_id,
        senderUserId: message.sender_id,
        viewerIsConversationParticipant: conversationAccess.isParticipant,
        isPaid: true,
      },
      legacyDecision: {
        canView: false,
        allowed: false,
        isLocked: true,
        lockReason: "message_purchase",
        source: "message_purchase_unsupported",
        reason: "message_purchase_unsupported",
      },
    })

    return createSecureMessageMediaContract({
      items: [],
      messageId,
      viewerUserId: userId,
    })
  }


  await shadowEvaluateAccessNoThrow({
    viewerUserId: userId,
    surface: "message_media",
    subject: {
      type: "message",
      messageId,
      conversationId: message.conversation_id,
      senderUserId: message.sender_id,
      viewerIsConversationParticipant: conversationAccess.isParticipant,
      isPaid: message.type === "ppv",
    },
    legacyDecision: {
      canView: true,
      allowed: true,
      isLocked: false,
      lockReason: "none",
      source: "conversation_access",
      reason: "conversation_access",
    },
  })


  const mediaRows = await getMessageMediaRowsByMessageIdOrEmpty(messageId)

  const mediaMap = await createConversationMessageMediaMap({
    mediaRows: mediaRows as MessageMediaRow[],
    viewerUserId: userId,
    senderUserIdByMessageId: new Map([[messageId, message.sender_id]]),
  })

  const secureMedia = mediaMap.get(messageId) ?? []

  verifySecureMessageMediaRuntimeNoThrow({
    mediaIds: mediaRows.map((media) => media.id),
    capabilitySignalIds: secureMedia.map((media) => media.id),
  })

  return createSecureMessageMediaContract({
    items: secureMedia,
    messageId,
    viewerUserId: userId,
  })
}
