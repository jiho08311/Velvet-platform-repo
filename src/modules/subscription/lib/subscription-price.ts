export const SUBSCRIPTION_PRICES = [
  4900,
  9900,
  19900,
  29900,
] as const

export type SubscriptionPrice = (typeof SUBSCRIPTION_PRICES)[number]

export function isValidSubscriptionPrice(
  price: number
): price is SubscriptionPrice {
  return SUBSCRIPTION_PRICES.includes(price as SubscriptionPrice)
}

export function assertValidSubscriptionPrice(
  price: number
): SubscriptionPrice {
  if (!isValidSubscriptionPrice(price)) {
    throw new Error("INVALID_SUBSCRIPTION_PRICE")
  }

  return price
}