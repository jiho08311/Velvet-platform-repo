import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type GetConversationParams = {
  conversationId: string
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

export async function getConversation({
  conversationId,
}: GetConversationParams): Promise<Conversation | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("conversations")
    .select("id, created_at, updated_at, last_message_at")
    .eq("id", conversationId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const row = data as ConversationRow

  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
  }
}