import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ConversationRow = {
  id: string
  created_at: string
  updated_at: string
  last_message_at: string | null
}

type ConversationParticipantRow = {
  conversation_id: string
  user_id: string
}

export type Conversation = {
  id: string
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
}

type ListConversationsParams = {
  userId: string
}

export async function listConversations({
  userId,
}: ListConversationsParams): Promise<Conversation[]> {
  const supabase = await createSupabaseServerClient()

  const { data: participants, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId)

  if (participantError) {
    throw participantError
  }

  const conversationIds =
    participants?.map((p) => p.conversation_id)
  if (conversationIds.length === 0 ) {
    return []
  }

  const { data, error } = await supabase
    .from("conversations")
    .select("id, created_at, updated_at, last_message_at")
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: ConversationRow) => ({
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
  }))
}