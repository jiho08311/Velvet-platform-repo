import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { getConversationAccess } from "@/modules/message/server/get-conversation-access"
import { getConversationParticipantIdentity } from "@/modules/message/server/get-conversation-participant-identity"
import { type ConversationSummary } from "@/modules/message/types"

type GetConversationByIdInput = {
  conversationId: string
  userId: string
}

type ConversationRow = {
  id: string
  created_at: string
  updated_at: string
  last_message_at: string | null
}

export async function getConversationById({
  conversationId,
  userId,
}: GetConversationByIdInput): Promise<ConversationSummary | null> {
  const supabase = await createSupabaseServerClient()

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, created_at, updated_at, last_message_at")
    .eq("id", conversationId)
    .maybeSingle<ConversationRow>()

  if (conversationError) {
    throw conversationError
  }

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
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    lastMessageAt: conversation.last_message_at,
    participant,
    lastMessage: null,
  }
}
