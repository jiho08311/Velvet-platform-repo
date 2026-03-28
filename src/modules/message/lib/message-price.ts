export const MESSAGE_PRICE_OPTIONS = [1000, 3000, 5000] as const

export type MessagePrice = (typeof MESSAGE_PRICE_OPTIONS)[number]

export function assertValidMessagePrice(price: number): MessagePrice {
  if (!MESSAGE_PRICE_OPTIONS.includes(price as MessagePrice)) {
    throw new Error("INVALID_MESSAGE_PRICE")
  }

  return price as MessagePrice
}