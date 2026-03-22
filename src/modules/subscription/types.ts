export type SubscriptionId = string

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "expired"

export type Subscription = {
  id: SubscriptionId
  userId: string
  creatorId: string
  status: SubscriptionStatus
  currentPeriodEndAt: string
}