import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import {
  createConversationMessageMediaMap,
  type MessageMediaRow,
} from "@/modules/message/server/create-conversation-message-media"
import { requireConversationAccess } from "@/modules/message/server/get-conversation-access"

export async function getSecureMessageMedia({
  messageId,
  userId,
}: {
  messageId: string
  userId: string
}) {
  const supabase = await createSupabaseServerClient()

  const { data: message } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, type")
    .eq("id", messageId)
    .maybeSingle()

  if (!message) return []

  await requireConversationAccess({
    conversationId: message.conversation_id,
    userId,
  })

  const { data: mediaRows } = await supabase
    .from("media")
    .select("id, message_id, storage_path, mime_type")
    .eq("message_id", messageId)

  const mediaMap = await createConversationMessageMediaMap({
    mediaRows: (mediaRows ?? []) as MessageMediaRow[],
    viewerUserId: userId,
    senderUserIdByMessageId: new Map([[messageId, message.sender_id]]),
  })

  return mediaMap.get(messageId) ?? []
}
