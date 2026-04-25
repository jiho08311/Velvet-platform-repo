import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import {
  createConversationMessageMediaMap,
  type MessageMediaRow,
} from "@/modules/message/server/create-conversation-message-media"
import { requireConversationAccess } from "@/modules/message/server/get-conversation-access"
import {
  compareConversationMessageOrder,
  normalizeConversationMessageItem,
  type ConversationMessageItem,
} from "@/modules/message/types"

type ListMessagesParams = {
  conversationId: string
  userId: string
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  created_at: string
  read_at: string | null
  status: string | null
  type: string | null
  price: number | null
}

export async function listMessages({
  conversationId,
  userId,
}: ListMessagesParams): Promise<ConversationMessageItem[]> {
  const supabase = await createSupabaseServerClient()

  await requireConversationAccess({
    conversationId,
    userId,
  })

  const { data: messagesData, error: messagesError } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_id, content, created_at, read_at, status, type, price"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (messagesError) {
    throw messagesError
  }

  const messageRows = (messagesData ?? []) as MessageRow[]
  const messageIds = messageRows.map((message) => message.id)

  let mediaRows: MessageMediaRow[] = []

  if (messageIds.length > 0) {
    const { data: mediaData, error: mediaError } = await supabase
      .from("media")
      .select("id, message_id, storage_path, mime_type")
      .in("message_id", messageIds)
      .order("created_at", { ascending: true })

    if (mediaError) {
      throw mediaError
    }

    mediaRows = (mediaData ?? []) as MessageMediaRow[]
  }

  const senderUserIdByMessageId = new Map(
    messageRows.map((message) => [message.id, message.sender_id])
  )
  const mediaMap = await createConversationMessageMediaMap({
    mediaRows,
    viewerUserId: userId,
    senderUserIdByMessageId,
  })

  return messageRows
    .map((row) =>
      normalizeConversationMessageItem(row, mediaMap.get(row.id) ?? [])
    )
    .sort(compareConversationMessageOrder)
}
