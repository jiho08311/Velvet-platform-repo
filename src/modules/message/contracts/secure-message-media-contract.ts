import type { ConversationMessageMedia } from "@/modules/message/types"

export type SecureMessageMediaContract = {
  items: ConversationMessageMedia[]
  lineage: {
    messageId: string
    viewerUserId: string
    itemCount: number
  }
}

export function createSecureMessageMediaContract({
  items,
  messageId,
  viewerUserId,
}: {
  items: ConversationMessageMedia[]
  messageId: string
  viewerUserId: string
}): SecureMessageMediaContract {
  return {
    items,
    lineage: {
      messageId,
      viewerUserId,
      itemCount: items.length,
    },
  }
}

export function toSecureMessageMediaResponse(
  contract: SecureMessageMediaContract
): ConversationMessageMedia[] {
  return contract.items
}