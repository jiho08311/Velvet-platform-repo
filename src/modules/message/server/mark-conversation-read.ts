import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type MarkConversationReadParams = {
  conversationId: string
  userId: string
}

type ConversationParticipantRow = {
  conversation_id: string
}

export async function markConversationRead({
  conversationId,
  userId,
}: MarkConversationReadParams): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const { data: participant, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle<ConversationParticipantRow>()

  if (participantError) {
    throw participantError
  }

  if (!participant) {
    throw new Error("User is not a participant in this conversation")
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from("conversation_participants")
    .update({
      last_read_at: now,
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)

  if (error) {
    throw error
  }
}