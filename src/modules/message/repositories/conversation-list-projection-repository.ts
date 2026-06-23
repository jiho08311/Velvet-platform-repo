import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type ConversationListProjectionRow = {
  conversation_id: string
  created_at: string
  updated_at: string
  last_message_at: string | null
  last_message_id: string | null
  last_message_preview: string | null
  last_message_type: string | null
  last_sender_id: string | null
  participant_user_ids: string[]
  participant_profiles: Record<string, {
    username?: string | null
    displayName?: string | null
    avatarUrl?: string | null
  }>
  viewer_unread_counts: Record<string, number>
}

export async function listConversationListProjectionRowsByUserId(
  userId: string
): Promise<ConversationListProjectionRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_conversation_items")
    .select(`
      conversation_id,
      created_at,
      updated_at,
      last_message_at,
      last_message_id,
      last_message_preview,
      last_message_type,
      last_sender_id,
      participant_user_ids,
      participant_profiles,
      viewer_unread_counts
    `)
    .contains("participant_user_ids", [userId])
    .eq("is_conversation_visible", true)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })

  if (error) throw error

  return (data ?? []) as ConversationListProjectionRow[]
}