import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ListConversationParticipantsParams = {
  conversationId: string
}

type ConversationParticipantRow = {
  user_id: string
}

export async function listConversationParticipants({
  conversationId,
}: ListConversationParticipantsParams): Promise<string[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)

  if (error) {
    throw error
  }

  return (data ?? []).map((row: ConversationParticipantRow) => row.user_id)
}