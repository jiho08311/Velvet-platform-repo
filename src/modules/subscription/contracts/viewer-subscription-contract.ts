export type ViewerSubscriptionStatus = {
  isActive: boolean
  subscription: {
    id: string
    viewerUserId: string
    creatorId: string
    currentPeriodEndAt: string | null
    cancelAtPeriodEnd: boolean
    status: "active" | "canceled" | "expired"
  } | null
}

export type SubscriptionValidationResult = {
  userId: string
  creatorId: string
  isActive: boolean
  subscriptionId: string | null
}
