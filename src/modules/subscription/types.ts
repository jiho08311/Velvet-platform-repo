type SubscriptionStatus =
  | "incomplete"
  | "active"
  | "canceled"
  | "expired"

export type SubscriptionProvider = "toss" | "mock"

export type Subscription = {
  id: string

  userId: string
  creatorId: string

  status: SubscriptionStatus
  provider: SubscriptionProvider

  providerSubscriptionId: string | null

  currentPeriodStart: string | null
  currentPeriodEnd: string | null

  cancelledAt: string | null // ✅ LL로 통일

  cancelAtPeriodEnd: boolean

  createdAt: string
  updatedAt: string
}