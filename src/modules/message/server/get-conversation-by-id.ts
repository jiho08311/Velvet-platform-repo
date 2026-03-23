// src/modules/message/server/get-conversation-by-id.ts

import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type GetConversationByIdInput = {
  conversationId: string
  userId: string
}

type ConversationRow = {
  id: string
  created_at: string
  updated_at: string
  last_message_at: string | null
}

type ParticipantRow = {
  conversation_id: string
  user_id: string
}

type ProfileRow = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export async function getConversationById({
  conversationId,
  userId,
}: GetConversationByIdInput) {
  const supabase = await createSupabaseServerClient()

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, created_at, updated_at, last_message_at")
    .eq("id", conversationId)
    .maybeSingle<ConversationRow>()

  if (conversationError) {
    throw conversationError
  }

  if (!conversation) {
    return null
  }

  const { data: participants, error: participantsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .eq("conversation_id", conversationId)

  if (participantsError) {
    throw participantsError
  }

  const participantRows = (participants ?? []) as ParticipantRow[]

  const isParticipant = participantRows.some((row) => row.user_id === userId)

  if (!isParticipant) {
    return null
  }

  const otherUserId =
    participantRows.find((row) => row.user_id !== userId)?.user_id ?? null

  let participant = null

  if (otherUserId) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", otherUserId)
      .maybeSingle<ProfileRow>()

    if (profileError) {
      throw profileError
    }

    participant = profile
      ? {
          userId: profile.id,
          username: profile.username,
          displayName: profile.display_name ?? profile.username,
          avatarUrl: profile.avatar_url,
        }
      : null
  }

  return {
    id: conversation.id,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    lastMessageAt: conversation.last_message_at,
    participant,
  }
}