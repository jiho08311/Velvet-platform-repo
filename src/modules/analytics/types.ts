export type RecentPayment = {
  id: string
  amountCents: number
  type: "subscription" | "tip" | "ppv_message" | "ppv_post"
  createdAt: string
}

export type CreatorDashboardSummary = {
  subscriberCount: number
  activeSubscriptionCount: number
  monthlyRevenue: number
  subscriptionRevenue: number
  ppvPostRevenue: number
  ppvMessageRevenue: number
  recentPayments: RecentPayment[]
}