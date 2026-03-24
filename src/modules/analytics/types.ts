export type AnalyticsSummary = {
  totalUsers: number
  totalCreators: number
  totalSubscribers: number
  totalRevenue: number
}

export type CreatorDashboardSummary = {
  subscriberCount: number
  activeSubscriptionCount: number
  monthlyRevenue: number
  recentPayments: Array<{
    id: string
    amount: number
    currency: string
    status: string
    createdAt: string
  }>
}