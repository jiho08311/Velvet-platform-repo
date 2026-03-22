export type PaymentType = "subscription" | "ppv_post" | "ppv_message"

export type PaymentStatus = "pending" | "succeeded" | "failed"

export type Payment = {
  id: string
  userId: string
  creatorId: string
  amount: number
  currency: string
  status: PaymentStatus
  type: PaymentType
}