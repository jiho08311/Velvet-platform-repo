import {
  findConversationParticipantIdentityProfileById,
} from "@/modules/message/repositories/conversation-participant-repository"
import {
  normalizeConversationParticipantIdentity,
  type ConversationParticipantIdentity,
} from "@/modules/message/types"

type GetConversationParticipantIdentityParams = {
  userId: string | null
}

export async function getConversationParticipantIdentity({
  userId,
}: GetConversationParticipantIdentityParams): Promise<ConversationParticipantIdentity | null> {
  if (!userId) {
    return null
  }

  const profile = await findConversationParticipantIdentityProfileById(userId)

  return normalizeConversationParticipantIdentity(profile)
}
