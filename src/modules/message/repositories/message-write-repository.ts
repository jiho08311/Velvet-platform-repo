import { randomUUID } from "crypto"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type MessageWriteRow = {
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

type InsertConversationMessageParams = {
  conversationId: string
  senderId: string
  content: string
}

type TouchConversationAfterMessageSentParams = {
  conversationId: string
  lastMessageAt: string
  lastMessageId: string
  lastMessagePreview: string
  lastMessageType: string
  lastSenderId: string
}

type CanonicalMessageWriteRow = {
  message_id: string
  conversation_id: string
  sender_id: string
  content: string | null
  created_at: string
  read_at: string | null
  status: string | null
  type: string | null
  price: number | null
}

function toMessageWriteRow(row: CanonicalMessageWriteRow): MessageWriteRow {
  return {
    id: row.message_id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    content: row.content,
    created_at: row.created_at,
    read_at: row.read_at,
    status: row.status,
    type: row.type,
    price: row.price,
  }
}

export async function insertConversationMessage({
  conversationId,
  senderId,
  content,
}: InsertConversationMessageParams): Promise<MessageWriteRow> {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()
  const messageId = randomUUID()

  const { data, error } = await supabase
    .from("canonical_message_items")
    .insert({
      message_id: messageId,
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      created_at: now,
      read_at: null,
      status: "sent",
      type: "text",
      price: null,
      message_visibility_state: "visible",
      is_message_visible: true,
      source_table: "canonical_message_items",
      authority_mode: "canonical_authoritative",
      runtime_authoritative: true,
      serving_authoritative: true,
      rollback_safe: true,
      observed_at: now,
    })
    .select(
      "message_id, conversation_id, sender_id, content, created_at, read_at, status, type, price"
    )
    .single<CanonicalMessageWriteRow>()

  if (error) {
    throw error
  }

  return toMessageWriteRow(data)
}

export async function touchConversationAfterMessageSent({
  conversationId,
  lastMessageAt,
  lastMessageId,
  lastMessagePreview,
  lastMessageType,
  lastSenderId,
}: TouchConversationAfterMessageSentParams): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("canonical_conversation_items")
 .update({
  updated_at: new Date().toISOString(),
  last_message_at: lastMessageAt,
  last_message_id: lastMessageId,
  last_message_preview: lastMessagePreview,
  last_message_type: lastMessageType,
  last_sender_id: lastSenderId,
  observed_at: new Date().toISOString(),
  authority_mode: "canonical_authoritative",
  runtime_authoritative: true,
  serving_authoritative: true,
})
    .eq("conversation_id", conversationId)

  if (error) {
    throw error
  }
}