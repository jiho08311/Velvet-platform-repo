import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { getConversationAccess } from "@/modules/message/server/get-conversation-access"
import { getConversationParticipantIdentity } from "@/modules/message/server/get-conversation-participant-identity"
import {
  normalizeConversationSummaryLastMessage,
  type ConversationSummary,
} from "@/modules/message/types"

type ConversationRow = {
  id: string
  created_at: string
  updated_at: string
  last_message_at: string | null
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  created_at: string
  type: string | null
}

type ListConversationsParams = {
  userId: string
}

export async function listConversations({
  userId,
}: ListConversationsParams): Promise<ConversationSummary[]> {
  const supabase = await createSupabaseServerClient()

  const { data: participantRows, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .eq("user_id", userId)

  if (participantError) {
    throw participantError
  }

  const conversationIds = Array.from(
    new Set((participantRows ?? []).map((row) => row.conversation_id))
  )

  if (conversationIds.length === 0) {
    return []
  }

  const conversationAccessEntries = await Promise.all(
    conversationIds.map(async (conversationId) => [
      conversationId,
      await getConversationAccess({
        conversationId,
        userId,
      }),
    ] as const)
  )
  const conversationAccessById = new Map(conversationAccessEntries)
  const visibleConversationIds = conversationAccessEntries
    .filter(([, access]) => access.canAccess)
    .map(([conversationId]) => conversationId)

  if (visibleConversationIds.length === 0) {
    return []
  }

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id, created_at, updated_at, last_message_at")
    .in("id", visibleConversationIds)
    .order("last_message_at", { ascending: false })

  if (conversationsError) {
    throw conversationsError
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at, type")
    .in("conversation_id", visibleConversationIds)
    .order("created_at", { ascending: false })

  if (messagesError) {
    throw messagesError
  }

  const messageRows = (messages ?? []) as MessageRow[]
  const lastMessageMap = new Map<string, MessageRow>()

  for (const message of messageRows) {
    if (!lastMessageMap.has(message.conversation_id)) {
      lastMessageMap.set(message.conversation_id, message)
    }
  }

  const conversationSummaries = await Promise.all(
    ((conversations ?? []) as ConversationRow[]).map(async (row) => {
      const participantUserId =
        conversationAccessById.get(row.id)?.otherUserId ?? null
      const lastMessage = lastMessageMap.get(row.id)
      const participant = await getConversationParticipantIdentity({
        userId: participantUserId,
      })

      return {
        id: row.id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastMessageAt: row.last_message_at,
        participant,
        lastMessage: lastMessage
          ? normalizeConversationSummaryLastMessage(lastMessage)
          : null,
      }
    })
  )

  return conversationSummaries.filter((row) => row.participant !== null)
}
