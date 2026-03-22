import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type SendMessageParams = {
  conversationId: string
  senderId: string
  content: string
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

export async function sendMessage({
  conversationId,
  senderId,
  content,
}: SendMessageParams): Promise<Message> {
  const supabase = await createSupabaseServerClient()

  const { data: participant, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", senderId)
    .maybeSingle()

  if (participantError) {
    throw participantError
  }

  if (!participant) {
    throw new Error("User is not a participant in this conversation")
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      created_at: now,
    })
    .select("id, conversation_id, sender_id, content, created_at")
    .single<MessageRow>()

  if (error) {
    throw error
  }

  const { error: updateError } = await supabase
    .from("conversations")
    .update({
      last_message_at: now,
      updated_at: now,
    })
    .eq("id", conversationId)

  if (updateError) {
    throw updateError
  }

  return {
    id: data.id,
    conversationId: data.conversation_id,
    senderId: data.sender_id,
    content: data.content,
    createdAt: data.created_at,
  }
}