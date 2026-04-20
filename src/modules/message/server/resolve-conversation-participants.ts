import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ParticipantRow = {
  conversation_id: string
  user_id: string
}

type ResolveConversationParticipantsParams = {
  conversationId: string
  userId: string
}

export type ResolvedConversationParticipants = {
  participantRows: ParticipantRow[]
  participantUserIds: string[]
  isParticipant: boolean
  otherUserId: string | null
}

export async function resolveConversationParticipants({
  conversationId,
  userId,
}: ResolveConversationParticipantsParams): Promise<ResolvedConversationParticipants> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .eq("conversation_id", conversationId)

  if (error) {
    throw error
  }

  const participantRows = (data ?? []) as ParticipantRow[]
  const participantUserIds = participantRows.map((row) => row.user_id)
  const isParticipant = participantUserIds.includes(userId)
  const otherUserId =
    participantUserIds.find((participantUserId) => participantUserId !== userId) ??
    null

  return {
    participantRows,
    participantUserIds,
    isParticipant,
    otherUserId,
  }
}