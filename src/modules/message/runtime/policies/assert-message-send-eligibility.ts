import { canAccessCreator } from "@/modules/commerce/public/entitlement-contract"
import { readCreatorIdentityByUserId } from "@/modules/identity/public/read-creator-identity"

type AssertMessageSendEligibilityParams = {
  senderId: string
  otherUserId: string
}

export async function assertMessageSendEligibility({
  senderId,
  otherUserId,
}: AssertMessageSendEligibilityParams): Promise<void> {
  const senderCreator = await readCreatorIdentityByUserId(senderId)
  const otherCreator = await readCreatorIdentityByUserId(otherUserId)

  const senderIsCreator = Boolean(senderCreator)

  if (!senderIsCreator && otherCreator) {
    const { decision } = await canAccessCreator({
      viewerUserId: senderId,
      creatorId: otherCreator.id,
    })

    if (!decision.allowed) {
      throw new Error("Subscription required")
    }
  }
}
