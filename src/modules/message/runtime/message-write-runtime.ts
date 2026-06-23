import {
  createConversationMessageMediaMap,
  type MessageMediaRow,
} from "@/modules/message/runtime/services/create-conversation-message-media"
import {
  insertConversationMessage,
  touchConversationAfterMessageSent,
  type MessageWriteRow,
} from "@/modules/message/repositories/message-write-repository"
import { getMessageMediaRowsByMessageId } from "@/modules/media/public/get-message-media"
import { attachMessageMediaRowsToMessage } from "@/modules/media/public/attach-message-media"
import { normalizeConversationMessageItem } from "@/modules/message/types"

export async function executeMessageWriteRuntime(input: {
  conversationId: string
  senderId: string
  content: string
  mediaIds: string[]
}): Promise<MessageWriteRow> {
  const message = await insertConversationMessage({
    conversationId: input.conversationId,
    senderId: input.senderId,
    content: input.content,
  })

  if (input.mediaIds.length > 0) {
    const updatedMediaList = await attachMessageMediaRowsToMessage({
      mediaIds: input.mediaIds,
      messageId: message.id,
    })

    if (updatedMediaList.length !== input.mediaIds.length) {
      throw new Error("Failed to attach media to message")
    }
  }

await touchConversationAfterMessageSent({
  conversationId: input.conversationId,
  lastMessageAt: message.created_at,
  lastMessageId: message.id,
  lastMessagePreview: message.content ?? "",
  lastMessageType: message.type ?? "text",
  lastSenderId: message.sender_id,
})

  return message
}

export async function buildPersistedMessageResponse(input: {
  message: MessageWriteRow
  viewerUserId: string
}) {
  const mediaRows = (await getMessageMediaRowsByMessageId(
    input.message.id
  )) as MessageMediaRow[]

  const mediaMap = await createConversationMessageMediaMap({
    mediaRows,
    viewerUserId: input.viewerUserId,
    senderUserIdByMessageId: new Map([
      [input.message.id, input.message.sender_id],
    ]),
  })

  return normalizeConversationMessageItem(
    input.message,
    mediaMap.get(input.message.id) ?? []
  )
}
