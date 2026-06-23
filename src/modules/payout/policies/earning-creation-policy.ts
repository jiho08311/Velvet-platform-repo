import type { PaymentForEarning } from "@/modules/payment/public/get-payment-for-earning"
import type { EarningSourceType } from "@/modules/payout/types"

export type EarningCreationEligibility = {
  creatorId: string
  sourceType: EarningSourceType
  grossamount: number
}

export function resolveEarningSourceType(
  type: PaymentForEarning["type"]
): EarningSourceType | null {
  if (type === "subscription") {
    return "subscription"
  }

  if (type === "ppv_post") {
    return "ppv_post"
  }

  if (type === "ppv_message") {
    return "ppv_message"
  }

  if (type === "tip") {
    return "ppv_message"
  }

  return null
}

export function resolveEarningCreationEligibility(
  payment: PaymentForEarning
): EarningCreationEligibility | null {
  if (!payment.creator_id) {
    throw new Error("PAYMENT_CREATOR_REQUIRED")
  }

  if (payment.status !== "succeeded") {
    throw new Error("PAYMENT_NOT_SUCCEEDED")
  }

  const sourceType = resolveEarningSourceType(payment.type)

  if (!sourceType) {
    return null
  }

  const grossamount = payment.amount ?? 0

  if (grossamount <= 0) {
    throw new Error("INVALID_PAYMENT_AMOUNT")
  }

  return {
    creatorId: payment.creator_id,
    sourceType,
    grossamount,
  }
}
