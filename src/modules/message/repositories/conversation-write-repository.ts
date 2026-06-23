import { randomUUID } from "crypto"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type CanonicalConversationWriteRow = {
  conversation_id: string
  created_at: string
  updated_at: string
  last_message_at: string | null
  participant_user_ids: string[]
  participant_count: number
}

function normalizeParticipantUserIds(userIds: string[]) {
  return Array.from(new Set(userIds.map((id) => id.trim()).filter(Boolean))).sort()
}

function toConversation(row: CanonicalConversationWriteRow) {
  return {
    id: row.conversation_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
  }
}

export async function findCanonicalConversationByParticipants(
  participantUserIds: string[]
) {
  const normalizedParticipantUserIds =
    normalizeParticipantUserIds(participantUserIds)

  if (normalizedParticipantUserIds.length < 2) {
    return null
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_conversation_items")
    .select(
      "conversation_id, created_at, updated_at, last_message_at, participant_user_ids, participant_count"
    )
    .contains("participant_user_ids", normalizedParticipantUserIds)
    .eq("participant_count", normalizedParticipantUserIds.length)
    .eq("is_conversation_visible", true)

  if (error) {
    throw error
  }

  const matchedRow = ((data ?? []) as CanonicalConversationWriteRow[]).find(
    (row) => {
      const rowParticipantUserIds = normalizeParticipantUserIds(
        row.participant_user_ids ?? []
      )

      return (
        rowParticipantUserIds.length === normalizedParticipantUserIds.length &&
        rowParticipantUserIds.every(
          (userId, index) => userId === normalizedParticipantUserIds[index]
        )
      )
    }
  )

  return matchedRow ? toConversation(matchedRow) : null
}

export async function insertCanonicalConversation(participantUserIds: string[]) {
  const normalizedParticipantUserIds =
    normalizeParticipantUserIds(participantUserIds)

  if (normalizedParticipantUserIds.length < 2) {
    throw new Error("Conversation requires at least two participants")
  }

  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()
  const conversationId = randomUUID()

  const { data, error } = await supabase
    .from("canonical_conversation_items")
    .insert({
      conversation_id: conversationId,
      created_at: now,
      updated_at: now,
      last_message_at: null,
      participant_user_ids: normalizedParticipantUserIds,
      participant_count: normalizedParticipantUserIds.length,
      conversation_visibility_state: "visible",
      is_conversation_visible: true,
      source_table: "canonical_conversation_items",
      authority_mode: "canonical_authoritative",
      runtime_authoritative: true,
      serving_authoritative: true,
      rollback_safe: true,
      observed_at: now,
    })
    .select(
      "conversation_id, created_at, updated_at, last_message_at, participant_user_ids, participant_count"
    )
    .single<CanonicalConversationWriteRow>()

  if (error) {
    throw error
  }

  return toConversation(data)
}