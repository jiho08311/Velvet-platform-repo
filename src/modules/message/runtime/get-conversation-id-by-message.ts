import { findMessageConversationRowById } from "@/modules/message/repositories/message-read-repository"
import { getConversationAccess } from "@/modules/message/runtime/policies/get-conversation-access"

type GetConversationIdByMessageParams = {
  messageId: string
  userId: string
}

export async function getConversationIdByMessage({
  messageId,
  userId,
}: GetConversationIdByMessageParams): Promise<string | null> {
  const message = await findMessageConversationRowById(messageId)

  if (!message) {
    return null
  }

  const access = await getConversationAccess({
    conversationId: message.conversation_id,
    userId,
  })

  if (!access.canAccess) {
    return null
  }

  return message.conversation_id
}
