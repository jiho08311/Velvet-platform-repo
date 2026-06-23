import { listMessageRowsByConversationId } from "@/modules/message/repositories/message-read-repository"
import { requireConversationAccess } from "@/modules/message/runtime/policies/get-conversation-access"
import { upsertConversationReadState } from "@/modules/message/repositories/conversation-read-state-repository"

type MarkConversationReadParams = {
  conversationId: string
  userId: string
}

export async function markConversationRead({
  conversationId,
  userId,
}: MarkConversationReadParams): Promise<void> {
  await requireConversationAccess({
    conversationId,
    userId,
  })

  const messages = await listMessageRowsByConversationId(conversationId)
  const lastMessage = messages[messages.length - 1] ?? null

  await upsertConversationReadState({
    conversationId,
    userId,
    lastReadMessageId: lastMessage?.id ?? null,
    lastReadAt: new Date().toISOString(),
    unreadCount: 0,
  })
}