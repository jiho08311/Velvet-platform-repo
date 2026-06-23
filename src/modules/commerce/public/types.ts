export type CommerceCurrency = "KRW"

export type Money = {
  amount: number
  currency: CommerceCurrency
}

export type CommerceActor =
  | { type: "user"; id: string }
  | { type: "admin"; id: string }
  | { type: "system" }

export type CommerceContext = {
  actor?: CommerceActor
  requestId?: string
  correlationId?: string
  causationId?: string
}

// authority: canonical_payment_state
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded"
export type PaymentProvider = "mock" | "toss"
export type PaymentPurpose = "subscription" | "ppv_post" | "ppv_message" | "tip"

export type PaymentTarget =
  | { type: "post"; id: string }
  | { type: "message"; id: string }
  | null

export type PaymentState = {
  paymentId: string // canonical_payment_state.id
  payerUserId: string // Identity public user authority id
  creatorId: string | null // Creator/Identity public creator authority id
  purpose: PaymentPurpose
  status: PaymentStatus
  money: Money
  provider: PaymentProvider
  target: PaymentTarget
  confirmedAt: string | null
  failedAt: string | null
  refundedAt: string | null
  createdAt: string
  updatedAt: string
}

// authority: canonical_subscription_state
export type SubscriptionStatus = "incomplete" | "active" | "canceled" | "expired"
export type SubscriptionAccessState = "active" | "inactive"
export type SubscriptionDisplayState = "active" | "ending" | "expired" | "inactive"

export type SubscriptionState = {
  subscriptionId: string // canonical_subscription_state.id
  subscriberUserId: string // Identity public user authority id
  creatorId: string // Creator/Identity public creator authority id
  status: SubscriptionStatus
  accessState: SubscriptionAccessState
  displayState: SubscriptionDisplayState
  hasAccess: boolean
  cancelAtPeriodEnd: boolean
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  createdAt: string
  updatedAt: string
}

// authority: runtime decision from canonical_subscription_state + canonical_payment_state
export type EntitlementSubject =
  | { type: "creator"; creatorId: string }
  | { type: "post"; postId: string }
  | { type: "message"; messageId: string }

export type EntitlementDecisionSource = "owner" | "subscription" | "payment" | "none"

export type EntitlementDecisionReason =
  | "owner"
  | "active_subscription"
  | "ending_subscription"
  | "purchased"
  | "not_subscribed"
  | "not_purchased"
  | "not_found"
  | "unauthenticated"

export type EntitlementDecision = {
  allowed: boolean
  subject: EntitlementSubject
  source: EntitlementDecisionSource
  reason: EntitlementDecisionReason
  expiresAt: string | null
}

// authority: canonical_earning_state
export type EarningStatus = "pending" | "available" | "requested" | "paid_out" | "reversed"
export type EarningSource = "subscription" | "ppv_post" | "ppv_message"

export type EarningState = {
  earningId: string // canonical_earning_state.id
  creatorId: string // Creator/Identity public creator authority id
  source: EarningSource
  paymentId: string // canonical_payment_state.id
  payoutRequestId: string | null // canonical_payout_request_state.id
  payoutId: string | null // canonical_payout_state.id
  gross: Money
  fee: {
    money: Money
    rateBps: number
  }
  net: Money
  status: EarningStatus
  availableAt: string | null
  paidOutAt: string | null
  reversedAt: string | null
  createdAt: string
}

// authority: canonical_payout_request_state
export type PayoutRequestStatus = "pending" | "approved" | "rejected"

export type PayoutRequestState = {
  payoutRequestId: string // canonical_payout_request_state.id
  creatorId: string // Creator/Identity public creator authority id
  money: Money
  status: PayoutRequestStatus
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
}

// authority: canonical_payout_state
export type PayoutExecutionStatus = "pending" | "processing" | "paid" | "failed"

export type PayoutExecutionState = {
  payoutId: string // canonical_payout_state.id
  payoutRequestId: string | null // canonical_payout_request_state.id
  creatorId: string // Creator/Identity public creator authority id
  money: Money
  status: PayoutExecutionStatus
  createdAt: string
  paidAt: string | null
  failureReason: string | null
}

export type CreatorEarningsBalance = {
  creatorId: string
  currency: CommerceCurrency
  pending: number
  available: number
  requested: number
  paidOut: number
  reversed: number
  requestable: number
}