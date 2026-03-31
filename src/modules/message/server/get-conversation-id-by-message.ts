import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type GetConversationIdByMessageParams = {
  messageId: string
  userId: string
}

type MessageRow = {
  id: string
  conversation_id: string
}

type ParticipantRow = {
  user_id: string
}

export async function getConversationIdByMessage({
  messageId,
  userId,
}: GetConversationIdByMessageParams): Promise<string | null> {
  const supabase = await createSupabaseServerClient()

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .select("id, conversation_id")
    .eq("id", messageId)
    .maybeSingle<MessageRow>()

  if (messageError) {
    throw messageError
  }

  if (!message) {
    return null
  }

  const { data: participants, error: participantError } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", message.conversation_id)

  if (participantError) {
    throw participantError
  }

  const isParticipant = ((participants ?? []) as ParticipantRow[]).some(
    (participant) => participant.user_id === userId
  )

  if (!isParticipant) {
    return null
  }

  return message.conversation_id
}