import {
  findConversationParticipantProfileById,
  listConversationParticipantRows,
  type ConversationParticipantProfileRow,
} from "@/modules/message/repositories/conversation-participant-repository"

type GetConversationAccessParams = {
  conversationId: string
  userId: string
}

export type ConversationAccess = {
  isParticipant: boolean
  otherUserId: string | null
  canAccess: boolean
}

function canAccessConversationWithProfile(
  profile: ConversationParticipantProfileRow | null
): boolean {
  if (!profile) {
    return false
  }

  return profile.profileLifecycleState === "active"
}

 

export async function getConversationAccess({
  conversationId,
  userId,
}: GetConversationAccessParams): Promise<ConversationAccess> {
  const participantRows = await listConversationParticipantRows(conversationId)
  const participantUserIds = participantRows.map((row) => row.user_id)
  const isParticipant = participantUserIds.includes(userId)
  const otherUserId =
    participantUserIds.find((participantUserId) => participantUserId !== userId) ??
    null

  if (!isParticipant || !otherUserId) {
    return {
      isParticipant,
      otherUserId,
      canAccess: false,
    }
  }

  const profile = await findConversationParticipantProfileById(otherUserId)

  return {
    isParticipant,
    otherUserId,
    canAccess: canAccessConversationWithProfile(profile),
  }
}

export async function requireConversationAccess(
  params: GetConversationAccessParams
): Promise<ConversationAccess> {
  const access = await getConversationAccess(params)

  if (!access.canAccess) {
    throw new Error("Unauthorized")
  }

  return access
}