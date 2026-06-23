import {
  assertValidPpvPrice as assertValidPpvPriceInternal,
  PPV_PRICE_OPTIONS as PPV_PRICE_OPTIONS_INTERNAL,
} from "@/modules/post/policies/ppv-price"

export const PUBLIC_CONTRACT = true

export const PPV_PRICE_OPTIONS = PPV_PRICE_OPTIONS_INTERNAL

export type PpvPrice = (typeof PPV_PRICE_OPTIONS)[number]

export function assertValidPpvPrice(price: number): PpvPrice {
  return assertValidPpvPriceInternal(price)
}
