import {
  assertValidMessagePrice as assertValidMessagePricePolicy,
} from "@/modules/message/policies/message-price"

export const PUBLIC_CONTRACT = true

export type MessagePrice = ReturnType<typeof assertValidMessagePricePolicy>

export function assertValidMessagePrice(price: number): MessagePrice {
  return assertValidMessagePricePolicy(price)
}
