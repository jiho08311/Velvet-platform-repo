import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ListMessagesParams = {
  conversationId: string
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export type Message = {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
}

export async function listMessages({
  conversationId,
}: ListMessagesParams): Promise<Message[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: MessageRow) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
  }))
}