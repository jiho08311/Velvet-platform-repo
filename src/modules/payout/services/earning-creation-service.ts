import type { PaymentForEarning } from "@/modules/payment/public/get-payment-for-earning"
import type { EarningCreationEligibility } from "@/modules/payout/policies/earning-creation-policy"
import type { EarningCreationInsertPayload } from "@/modules/payout/repositories/earning-write-repository"
import type { EarningSourceType } from "@/modules/payout/types"

export type EarningCreationValues = {
  insertPayload: EarningCreationInsertPayload
  feeRateBps: number
  feeamount: number
  netamount: number
  currency: string
}

function getFeeRateBps(type: EarningSourceType): number {
  switch (type) {
    case "subscription":
      return 2000
    case "ppv_post":
      return 1000
    case "ppv_message":
      return 1000
  }
}

function addDays(isoString: string, days: number): string {
  const date = new Date(isoString)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export function buildEarningCreationValues({
  payment,
  eligibility,
}: {
  payment: PaymentForEarning
  eligibility: EarningCreationEligibility
}): EarningCreationValues {
  const feeRateBps = getFeeRateBps(eligibility.sourceType)
  const feeamount = Math.floor((eligibility.grossamount * feeRateBps) / 10000)
  const netamount = eligibility.grossamount - feeamount
  const confirmedAt = payment.confirmed_at ?? new Date().toISOString()
  const availableAt = addDays(confirmedAt, 7)
  const currency = payment.currency ?? "KRW"

  return {
    insertPayload: {
      creator_id: eligibility.creatorId,
      payment_id: payment.id,
      payout_id: null,
      source_type: eligibility.sourceType,
      gross_amount: eligibility.grossamount,
      fee_rate_bps: feeRateBps,
      fee_amount: feeamount,
      net_amount: netamount,
      currency,
      status: "pending",
      available_at: availableAt,
      paid_out_at: null,
      reversed_at: null,
      created_at: confirmedAt,
    },
    feeRateBps,
    feeamount,
    netamount,
    currency,
  }
}
