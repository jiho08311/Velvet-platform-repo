import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type GetOrCreateConversationParams = {
  userAId: string
  userBId: string
}

type ConversationRow = {
  id: string
  created_at: string
  updated_at: string
  last_message_at: string | null
}

export type Conversation = {
  id: string
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
}

export async function getOrCreateConversation({
  userAId,
  userBId,
}: GetOrCreateConversationParams): Promise<Conversation> {
  const supabase = await createSupabaseServerClient()

  const { data: participantRows, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("user_id", [userAId, userBId])

  if (participantError) {
    throw participantError
  }

  const conversationCount = new Map<string, Set<string>>()

  for (const row of participantRows ?? []) {
    const set = conversationCount.get(row.conversation_id) ?? new Set<string>()
    set.add(row.user_id)
    conversationCount.set(row.conversation_id, set)
  }

  const existingConversationId = [...conversationCount.entries()].find(
    ([_, users]) => users.has(userAId) && users.has(userBId)
  )?.[0]

  if (existingConversationId) {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, created_at, updated_at, last_message_at")
      .eq("id", existingConversationId)
      .single<ConversationRow>()

    if (error) {
      throw error
    }

    return {
      id: data.id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastMessageAt: data.last_message_at,
    }
  }

  const now = new Date().toISOString()

  const { data: conversationData, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      created_at: now,
      updated_at: now,
      last_message_at: null,
    })
    .select("id, created_at, updated_at, last_message_at")
    .single<ConversationRow>()

  if (conversationError) {
    throw conversationError
  }

  const participants = [
    { conversation_id: conversationData.id, user_id: userAId },
    { conversation_id: conversationData.id, user_id: userBId },
  ]

  const { error: insertError } = await supabase
    .from("conversation_participants")
    .insert(participants)

  if (insertError) {
    throw insertError
  }

  return {
    id: conversationData.id,
    createdAt: conversationData.created_at,
    updatedAt: conversationData.updated_at,
    lastMessageAt: conversationData.last_message_at,
  }
}