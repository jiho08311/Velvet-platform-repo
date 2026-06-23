import { getDashboardCommerceOverview } from "@/modules/commerce/public/commerce-analytics-contract"
import { countCreatorDashboardPosts } from "@/modules/creator/repositories/creator-dashboard-repository"

export type CreatorDashboard = {
  creatorId: string
  postCount: number
  activeSubscriberCount: number
  earnings: {
    currency: string
    total: number
    monthly: number
  }
}

export async function getCreatorDashboard(
  creatorId: string,
): Promise<CreatorDashboard | null> {
  const id = creatorId.trim()

  if (!id) {
    return null
  }

  const [postCount, commerceOverview] = await Promise.all([
    countCreatorDashboardPosts(id),
    getDashboardCommerceOverview({
      creatorId: id,
    }),
  ])

  return {
    creatorId: id,
    postCount,
    activeSubscriberCount: commerceOverview.subscriptions.activeCount,
    earnings: {
      currency: commerceOverview.revenue.gross.currency,
      total: commerceOverview.revenue.gross.amount,
      monthly: commerceOverview.revenue.monthlyGross.amount,
    },
  }
}
