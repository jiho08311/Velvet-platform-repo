import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type MessageRow = {
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

export type MessageConversationRow = {
  id: string
  conversation_id: string
}

export type SecureMessageMediaAccessRow = {
  id: string
  conversation_id: string
  sender_id: string
  type: string | null
}

export type MessageConfirmationTargetRow = {
  id: string
  conversation_id: string
}

type CanonicalMessageItemRow = {
  message_id: string
  conversation_id: string
  sender_id: string
  content: string | null
  created_at: string
  read_at: string | null
  status: string | null
  type: string | null
  price: number | null
  is_message_visible: boolean
}

function toMessageRow(row: CanonicalMessageItemRow): MessageRow {
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

export async function listMessageRowsByConversationId(
  conversationId: string
): Promise<MessageRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_message_items")
    .select(
      "message_id, conversation_id, sender_id, content, created_at, read_at, status, type, price, is_message_visible"
    )
    .eq("conversation_id", conversationId)
    .eq("is_message_visible", true)
    .order("created_at", { ascending: true })

  if (error) {
    throw error
  }

  return ((data ?? []) as CanonicalMessageItemRow[]).map(toMessageRow)
}

export async function findMessageConversationRowById(
  messageId: string
): Promise<MessageConversationRow | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_message_items")
    .select("message_id, conversation_id, is_message_visible")
    .eq("message_id", messageId)
    .eq("is_message_visible", true)
    .maybeSingle<Pick<CanonicalMessageItemRow, "message_id" | "conversation_id" | "is_message_visible">>()

  if (error) {
    throw error
  }

  if (!data) return null

  return {
    id: data.message_id,
    conversation_id: data.conversation_id,
  }
}

export async function findSecureMessageMediaAccessRowByMessageId(
  messageId: string
): Promise<SecureMessageMediaAccessRow | null> {
  const supabase = await createSupabaseServerClient()

  const { data } = await supabase
    .from("canonical_message_items")
    .select("message_id, conversation_id, sender_id, type, is_message_visible")
    .eq("message_id", messageId)
    .eq("is_message_visible", true)
    .maybeSingle<Pick<CanonicalMessageItemRow, "message_id" | "conversation_id" | "sender_id" | "type" | "is_message_visible">>()

  if (!data) return null

  return {
    id: data.message_id,
    conversation_id: data.conversation_id,
    sender_id: data.sender_id,
    type: data.type,
  }
}

export async function findMessageConfirmationTargetById(
  messageId: string
): Promise<MessageConfirmationTargetRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_message_items")
    .select("message_id, conversation_id, is_message_visible")
    .eq("message_id", messageId)
    .eq("is_message_visible", true)
    .maybeSingle<Pick<CanonicalMessageItemRow, "message_id" | "conversation_id" | "is_message_visible">>()

  if (error || !data) {
    return null
  }

  return {
    id: data.message_id,
    conversation_id: data.conversation_id,
  }
}

export async function listLatestVisibleMessageRowsByConversationIds(
  conversationIds: string[]
): Promise<MessageRow[]> {
  if (conversationIds.length === 0) {
    return []
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_message_items")
    .select(
      "message_id, conversation_id, sender_id, content, created_at, read_at, status, type, price, is_message_visible"
    )
    .in("conversation_id", conversationIds)
    .eq("is_message_visible", true)
    .order("created_at", { ascending: false })
    .order("message_id", { ascending: true })

  if (error) {
    throw error
  }

  const latestByConversationId = new Map<string, MessageRow>()

  for (const row of (data ?? []) as CanonicalMessageItemRow[]) {
    const message = toMessageRow(row)

    if (!latestByConversationId.has(message.conversation_id)) {
      latestByConversationId.set(message.conversation_id, message)
    }
  }

  return Array.from(latestByConversationId.values())
}
