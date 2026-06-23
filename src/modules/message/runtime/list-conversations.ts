import {
  listConversationListProjectionRowsByUserId,
} from "@/modules/message/repositories/conversation-list-projection-repository"
import type {
  ConversationParticipantIdentity,
  ConversationSummaryLastMessage,
  ConversationSummaryViewModel,
} from "@/modules/message/types"

type ListConversationsParams = {
  userId: string
}

type ParticipantProfileSnapshot = {
  username?: string | null
  displayName?: string | null
  avatarUrl?: string | null
}

function resolveParticipant(input: {
  viewerUserId: string
  participantUserIds: string[]
  participantProfiles: Record<string, ParticipantProfileSnapshot>
}): ConversationParticipantIdentity | null {
  const otherUserId =
    input.participantUserIds.find((userId) => userId !== input.viewerUserId) ??
    null

  if (!otherUserId) return null

  const profile = input.participantProfiles[otherUserId] ?? {}

  return {
    userId: otherUserId,
    username: profile.username ?? "",
    displayName: profile.displayName ?? profile.username ?? "",
    avatarUrl: profile.avatarUrl ?? null,
  }
}

function resolveLastMessage(row: {
  conversation_id: string
  last_message_id: string | null
  last_message_preview: string | null
  last_message_type: string | null
  last_sender_id: string | null
  last_message_at: string | null
}): ConversationSummaryLastMessage | null {
  if (!row.last_message_id || !row.last_sender_id || !row.last_message_at) {
    return null
  }

  return {
    id: row.last_message_id,
    conversationId: row.conversation_id,
    senderId: row.last_sender_id,
    content: row.last_message_preview ?? "",
    createdAt: row.last_message_at,
    type: row.last_message_type === "ppv" ? "ppv" : "text",
  }
}

export async function listConversations({
  userId,
}: ListConversationsParams): Promise<ConversationSummaryViewModel[]> {
  const rows = await listConversationListProjectionRowsByUserId(userId)

  return rows
    .map((row) => ({
      id: row.conversation_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastMessageAt: row.last_message_at,
      unreadCount: row.viewer_unread_counts[userId] ?? 0,
      participant: resolveParticipant({
        viewerUserId: userId,
        participantUserIds: row.participant_user_ids,
        participantProfiles: row.participant_profiles,
      }),
      lastMessage: resolveLastMessage(row),
    }))
    .filter((row) => row.participant !== null)
}