import { readCreatorIdentityByUserId } from "@/modules/identity/public/read-creator-identity"
import { canAccessCreator } from "@/modules/commerce/public/entitlement-contract"
import {
  findCanonicalConversationByParticipants,
  insertCanonicalConversation,
} from "@/modules/message/repositories/conversation-write-repository"

type GetOrCreateConversationParams = {
  userAId: string
  userBId: string
}

export type Conversation = {
  id: string
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
}

async function assertDirectConversationEligibility({
  userAId,
  userBId,
}: GetOrCreateConversationParams) {
  const [userACreator, userBCreator] = await Promise.all([
    readCreatorIdentityByUserId(userAId),
    readCreatorIdentityByUserId(userBId),
  ])

  const userAIsCreator = Boolean(userACreator)
  const userBIsCreator = Boolean(userBCreator)

  if (!userAIsCreator && userBCreator) {
    const { decision } = await canAccessCreator({
      viewerUserId: userAId,
      creatorId: userBCreator.id,
    })

    if (!decision.allowed) {
      throw new Error("Subscription required")
    }
  }

  if (!userBIsCreator && userACreator) {
    const { decision } = await canAccessCreator({
      viewerUserId: userBId,
      creatorId: userACreator.id,
    })

    if (!decision.allowed) {
      throw new Error("Subscription required")
    }
  }
}

export async function getOrCreateConversation({
  userAId,
  userBId,
}: GetOrCreateConversationParams): Promise<Conversation> {
  if (!userAId || !userBId) {
    throw new Error("Conversation requires two participants")
  }

  if (userAId === userBId) {
    throw new Error("Conversation requires two distinct participants")
  }

  await assertDirectConversationEligibility({
    userAId,
    userBId,
  })

  const participantUserIds = [userAId, userBId]

  const existingConversation =
    await findCanonicalConversationByParticipants(participantUserIds)

  if (existingConversation) {
    return existingConversation
  }

  return insertCanonicalConversation(participantUserIds)
}