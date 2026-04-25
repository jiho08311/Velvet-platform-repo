export type PaymentType =
  | "subscription"
  | "tip"
  | "ppv_post"
  | "ppv_message"

export type PaymentStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded"

export type PaymentProvider = "mock" | "toss"

export type PaymentTargetType = "post" | "message" | null

export type PaymentAccessVerification =
  | {
      kind: "post"
      status: "unlocked" | "locked" | "missing_target"
      postId: string | null
    }
  | {
      kind: "subscription"
      status: "active" | "inactive" | "missing_creator"
      creatorId: string | null
      creatorUsername: string | null
    }
  | {
      kind: "payment"
      status: "payment_not_found" | "payment_not_successful" | "viewer_mismatch"
    }
  | {
      kind: "unsupported"
      status: "not_applicable"
      paymentType: "tip" | "ppv_message"
    }

export type Payment = {
  id: string
  userId: string
  creatorId: string | null
  subscriptionId: string | null
  amount: number
  currency: string
  status: PaymentStatus
  type: PaymentType
  provider: PaymentProvider
  providerReferenceId: string | null
  targetType: PaymentTargetType
  targetId: string | null
  confirmedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreatorPaymentHistoryItem = {
  id: string
  payerUserId: string | null
  payerLabel: string
  amount: number
  currency: string
  displayAmount: string
  status: PaymentStatus
  statusLabel: string
  paymentType: PaymentType
  paymentTypeLabel: string
  createdAt: string
  displayDate: string
}
