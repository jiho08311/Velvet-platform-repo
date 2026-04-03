export type PayoutId = string

export type PayoutStatus =
  | "paid"
  | "failed"

export type Payout = {
  id: PayoutId
  creatorId: string
  amount: number
  currency: string
  status: PayoutStatus
  createdAt: string
  paidAt: string | null
  processedAt: string | null
  failureReason: string | null
}

export type EarningId = string

export type EarningSourceType =
  | "subscription"
  | "ppv_post"
  | "ppv_message"

export type EarningStatus =
  | "pending"
  | "available"
  | "paid_out"
  | "reversed"

export type Earning = {
  id: EarningId
  creatorId: string
  paymentId: string
  payoutId: string | null
  sourceType: EarningSourceType
  grossamount: number
  feeRateBps: number
  feeamount: number
  netamount: number
  currency: string
  status: EarningStatus
  availableAt: string | null
  paidOutAt: string | null
  reversedAt: string | null
  createdAt: string
}

export type CreatorEarningsBalance = {
  creatorId: string
  currency: string
  pendingamount: number
  availableamount: number
  paidOutamount: number
  reversedamount: number
}