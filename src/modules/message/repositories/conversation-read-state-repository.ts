import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type ConversationReadStateRow = {
  conversation_id: string
  user_id: string
  last_read_message_id: string | null
  last_read_at: string
  unread_count: number
}

export async function upsertConversationReadState(input: {
  conversationId: string
  userId: string
  lastReadMessageId: string | null
  lastReadAt: string
  unreadCount?: number
}): Promise<ConversationReadStateRow> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_conversation_read_states")
    .upsert(
      {
        conversation_id: input.conversationId,
        user_id: input.userId,
        last_read_message_id: input.lastReadMessageId,
        last_read_at: input.lastReadAt,
        unread_count: input.unreadCount ?? 0,
        read_state: "read",
        authority_mode: "canonical_authoritative",
        runtime_authoritative: true,
        serving_authoritative: true,
        rollback_safe: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "conversation_id,user_id",
      }
    )
    .select("conversation_id, user_id, last_read_message_id, last_read_at, unread_count")
    .single<ConversationReadStateRow>()

  if (error) {
    throw error
  }

  return data
}

export async function listConversationReadStatesByUserId(input: {
  userId: string
  conversationIds: string[]
}): Promise<ConversationReadStateRow[]> {
  if (input.conversationIds.length === 0) {
    return []
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_conversation_read_states")
    .select(
      "conversation_id, user_id, last_read_message_id, last_read_at, unread_count"
    )
    .eq("user_id", input.userId)
    .in("conversation_id", input.conversationIds)

  if (error) {
    throw error
  }

  return (data ?? []) as ConversationReadStateRow[]
}