import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type CreateConversationParams = {
  participantIds: string[]
}

type ConversationRow = {
  id: string
  created_at: string
  updated_at: string
  last_message_at: string | null
}

export type Conversation = {
  id: string
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
}

export async function createConversation({
  participantIds,
}: CreateConversationParams): Promise<Conversation> {
  if (participantIds.length < 2) {
    throw new Error("Conversation requires at least two participants")
  }

  const supabase = await createSupabaseServerClient()

  const now = new Date().toISOString()

  const { data: conversationData, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      created_at: now,
      updated_at: now,
      last_message_at: null,
    })
    .select("id, created_at, updated_at, last_message_at")
    .single<ConversationRow>()

  if (conversationError) {
    throw conversationError
  }

  const participantsInsert = participantIds.map((userId) => ({
    conversation_id: conversationData.id,
    user_id: userId,
  }))

  const { error: participantError } = await supabase
    .from("conversation_participants")
    .insert(participantsInsert)

  if (participantError) {
    throw participantError
  }

  return {
    id: conversationData.id,
    createdAt: conversationData.created_at,
    updatedAt: conversationData.updated_at,
    lastMessageAt: conversationData.last_message_at,
  }
}