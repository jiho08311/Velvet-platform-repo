export type PayoutId = string

export type PayoutStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"

export type Payout = {
  id: PayoutId
  creatorId: string
  amount: number
  currency: string
  status: PayoutStatus
  createdAt: string
}