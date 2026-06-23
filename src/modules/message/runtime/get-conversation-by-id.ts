import { findConversationById } from "@/modules/message/repositories/conversation-read-repository"
import { getConversationAccess } from "@/modules/message/runtime/policies/get-conversation-access"
import { getConversationParticipantIdentity } from "@/modules/message/runtime/get-conversation-participant-identity"
import { type ConversationSummary } from "@/modules/message/types"

type GetConversationByIdInput = {
  conversationId: string
  userId: string
}

export async function getConversationById({
  conversationId,
  userId,
}: GetConversationByIdInput): Promise<ConversationSummary | null> {
  const conversation = await findConversationById(conversationId)

  if (!conversation) {
    return null
  }

  const access = await getConversationAccess({
    conversationId,
    userId,
  })

  if (!access.canAccess) {
    return null
  }

  const participant = await getConversationParticipantIdentity({
    userId: access.otherUserId,
  })

  return {
    id: conversation.id,
    unreadCount: 0,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    lastMessageAt: conversation.last_message_at,
    participant,

    /**
     * Legacy/detail compatibility.
     *
     * Detail pages must load thread content through listMessages().
     * This field remains null here to preserve getConversationById()
     * behavior and avoid mixing list preview shape with detail header shape.
     */
    lastMessage: null,
  }
}
