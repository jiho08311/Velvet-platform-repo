import {
  markMessageDeliveryFailed,
  markMessageDeliverySucceeded,
} from "@/modules/message/repositories/message-delivery-state-repository"

export const PUBLIC_CONTRACT = true

export type MarkMessageDeliverySucceededInput = {
  messageId: string
  recipientUserId: string
  deliveredAt?: string
}

export type MarkMessageDeliveryFailedInput = {
  messageId: string
  recipientUserId: string
  failureReason: string
  failedAt?: string
}

export async function markMessageDeliverySucceededPublic(
  input: MarkMessageDeliverySucceededInput
): ReturnType<typeof markMessageDeliverySucceeded> {
  return markMessageDeliverySucceeded(input)
}

export async function markMessageDeliveryFailedPublic(
  input: MarkMessageDeliveryFailedInput
): ReturnType<typeof markMessageDeliveryFailed> {
  return markMessageDeliveryFailed(input)
}
