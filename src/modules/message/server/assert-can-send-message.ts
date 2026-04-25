import { requireConversationAccess } from "@/modules/message/server/get-conversation-access"
import { assertMessageSendEligibility } from "@/modules/message/server/assert-message-send-eligibility"

type AssertCanSendMessageParams = {
  conversationId: string
  senderId: string
}

export type SendMessagePermission = {
  otherUserId: string
}

export async function assertCanSendMessage({
  conversationId,
  senderId,
}: AssertCanSendMessageParams): Promise<SendMessagePermission> {
  const access = await requireConversationAccess({
    conversationId,
    userId: senderId,
  })

  const otherUserId = access.otherUserId

  if (!otherUserId) {
    throw new Error("Unauthorized")
  }

  await assertMessageSendEligibility({
    senderId,
    otherUserId,
  })

  return {
    otherUserId,
  }
}
