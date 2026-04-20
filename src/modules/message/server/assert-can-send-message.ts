import { getConversationVisibility } from "@/modules/message/server/get-conversation-visibility"
import { assertMessageSendEligibility } from "@/modules/message/server/assert-message-send-eligibility"

type AssertCanSendMessageParams = {
  conversationId: string
  senderId: string
}

export type SendMessagePermission = {
  otherUserId: string | null
}

export async function assertCanSendMessage({
  conversationId,
  senderId,
}: AssertCanSendMessageParams): Promise<SendMessagePermission> {
  const visibility = await getConversationVisibility({
    conversationId,
    userId: senderId,
  })

  if (!visibility.isVisible) {
    throw new Error("Unauthorized")
  }

  const otherUserId = visibility.otherUserId

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