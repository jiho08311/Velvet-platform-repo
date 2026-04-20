import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { getConversationVisibility } from "@/modules/message/server/get-conversation-visibility"

type GetConversationIdByMessageParams = {
  messageId: string
  userId: string
}

type MessageRow = {
  id: string
  conversation_id: string
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

  const visibility = await getConversationVisibility({
    conversationId: message.conversation_id,
    userId,
  })

  if (!visibility.isVisible) {
    return null
  }

  return message.conversation_id
}