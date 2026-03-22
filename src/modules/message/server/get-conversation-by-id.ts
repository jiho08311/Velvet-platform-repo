import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type GetConversationByIdInput = {
  conversationId: string
  userId: string
}

export async function getConversationById({
  conversationId,
  userId,
}: GetConversationByIdInput) {
  const supabase = await createSupabaseServerClient()

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single()

  if (error) {
    throw error
  }

  if (!conversation) {
    return null
  }

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)

  const isParticipant = participants?.some(
    (p: { user_id: string }) => p.user_id === userId
  )

  if (!isParticipant) {
    return null
  }

  return conversation
}