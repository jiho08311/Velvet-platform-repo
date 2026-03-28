export const PPV_PRICE_OPTIONS = [4900, 9900, 15900, 19900] as const

export type PpvPrice = (typeof PPV_PRICE_OPTIONS)[number]

export function assertValidPpvPrice(price: number): PpvPrice {
  if (!PPV_PRICE_OPTIONS.includes(price as PpvPrice)) {
    throw new Error("Invalid post price")
  }

  return price as PpvPrice
}