import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type ConversationRow = {
  id: string
  created_at: string
  updated_at: string
  last_message_at: string | null
}

type CanonicalConversationItemRow = {
  conversation_id: string
  created_at: string
  updated_at: string
  last_message_at: string | null
  is_conversation_visible: boolean
}

function toConversationRow(row: CanonicalConversationItemRow): ConversationRow {
  return {
    id: row.conversation_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_message_at: row.last_message_at,
  }
}

export async function findConversationById(
  conversationId: string
): Promise<ConversationRow | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_conversation_items")
    .select("conversation_id, created_at, updated_at, last_message_at, is_conversation_visible")
    .eq("conversation_id", conversationId)
    .eq("is_conversation_visible", true)
    .maybeSingle<CanonicalConversationItemRow>()

  if (error) {
    throw error
  }

  return data ? toConversationRow(data) : null
}

export async function listConversationAdvisoryCandidateRows(
  conversationIds: readonly string[]
): Promise<ConversationRow[]> {
  if (conversationIds.length === 0) {
    return []
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_conversation_items")
    .select("conversation_id, created_at, updated_at, last_message_at, is_conversation_visible")
    .in("conversation_id", [...conversationIds])
    .eq("is_conversation_visible", true)
    .order("last_message_at", { ascending: false })
    .order("conversation_id", { ascending: true })

  if (error) {
    throw error
  }

  return ((data ?? []) as CanonicalConversationItemRow[]).map(toConversationRow)
}