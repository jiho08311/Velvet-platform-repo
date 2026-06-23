import { listMessageRowsByConversationId } from "@/modules/message/repositories/message-read-repository"
import {
  createConversationMessageMediaMap,
  type MessageMediaRow,
} from "@/modules/message/runtime/services/create-conversation-message-media"
import { requireConversationAccess } from "@/modules/message/runtime/policies/get-conversation-access"
import {
  compareConversationMessageOrder,
  normalizeConversationMessageItem,
  type ConversationMessageItem,
} from "@/modules/message/types"
import {
  getMessageMediaRowsByMessageIds,
} from "@/modules/media/public/get-message-media"
type ListMessagesParams = {
  conversationId: string
  userId: string
}
import { shadowEvaluateAccessNoThrow } from "@/modules/entitlement/public/shadow-evaluate-access"
export async function listMessages({
  conversationId,
  userId,
}: ListMessagesParams): Promise<ConversationMessageItem[]> {
  await requireConversationAccess({
    conversationId,
    userId,
  })

  const messageRows = await listMessageRowsByConversationId(conversationId)
  const messageIds = messageRows.map((message) => message.id)

  let mediaRows: MessageMediaRow[] = []

  if (messageIds.length > 0) {
    mediaRows = (await getMessageMediaRowsByMessageIds(
      messageIds
    )) as MessageMediaRow[]
  }

  const accessibleMessageIds = new Set(
    messageRows
      .filter((message) => message.type !== "ppv" || message.sender_id === userId)
      .map((message) => message.id)
  )
  const accessibleMediaRows = mediaRows.filter(
    (media) => media.message_id && accessibleMessageIds.has(media.message_id)
  )

  const senderUserIdByMessageId = new Map(
    messageRows.map((message) => [message.id, message.sender_id])
  )
  const mediaMap = await createConversationMessageMediaMap({
    mediaRows: accessibleMediaRows,
    viewerUserId: userId,
    senderUserIdByMessageId,
  })


  await Promise.all(
    messageRows.map((message) =>
      shadowEvaluateAccessNoThrow({
        viewerUserId: userId,
        surface: "message_list",
        subject: {
          type: "message",
          messageId: message.id,
          conversationId,
          senderUserId: message.sender_id,
          viewerIsConversationParticipant: true,
          isPaid: message.type === "ppv" || message.price !== null,
        },
        legacyDecision: {
          canView: true,
          allowed: true,
          isLocked: message.type === "ppv",
          lockReason: message.type === "ppv" ? "message_purchase" : "none",
          source: "conversation_access",
          reason: "conversation_access",
        },
      })
    )
  )



  const messages = messageRows
    .map((row) =>
      normalizeConversationMessageItem(row, mediaMap.get(row.id) ?? [])
    )
    .sort(compareConversationMessageOrder)

  return messages
}
