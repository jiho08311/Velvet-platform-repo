export type SubscriptionId = string

export type SubscriptionStatus =
  | "incomplete"
  | "active"
  | "canceled"
  | "expired"

export type SubscriptionProvider = "toss" | "mock"

export type Subscription = {
  id: SubscriptionId
  userId: string
  creatorId: string
  status: SubscriptionStatus
  provider: SubscriptionProvider
  providerSubscriptionId: string | null
  currentPeriodStartAt: string | null
  currentPeriodEndAt: string | null
  cancelledAt: string | null
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
}