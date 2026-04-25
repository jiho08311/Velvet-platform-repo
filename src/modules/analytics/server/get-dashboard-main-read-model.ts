import {
  formatCreatorAnalyticsSummaryMetricValue,
} from "@/modules/analytics/lib/creator-analytics-summary-metrics"
import {
  getDashboardPayoutOverviewReadModel,
  type DashboardPayoutOverviewReadModel,
} from "@/modules/analytics/server/get-dashboard-payout-overview-read-model"

type DashboardMainCreator = {
  id: string
  username: string
  subscriptionPrice: number
}

export type DashboardMainReadModel = {
  creator: DashboardMainCreator & {
    displaySubscriptionPrice: string
  }
  payoutSummary: DashboardPayoutOverviewReadModel["payoutSummary"] & {
    displayRequestableBalance: string
    displayRequestedPayoutAmount: string
  }
  payouts: DashboardPayoutOverviewReadModel["payouts"]
  subscribersMetric: DashboardPayoutOverviewReadModel["subscribersMetric"] & {
    displayValue: string
  }
}

function formatPrice(amount: number, currency = "KRW") {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
  }).format(amount)
}

export async function getDashboardMainReadModel(
  creator: DashboardMainCreator
): Promise<DashboardMainReadModel | null> {
  const overview = await getDashboardPayoutOverviewReadModel(creator.id)

  if (!overview) {
    return null
  }

  const { payoutSummary, payouts, subscribersMetric } = overview

  return {
    creator: {
      ...creator,
      displaySubscriptionPrice: formatPrice(creator.subscriptionPrice),
    },
    payoutSummary: {
      ...payoutSummary,
      displayRequestableBalance: formatPrice(
        payoutSummary.requestableBalance,
        payoutSummary.currency
      ),
      displayRequestedPayoutAmount: formatPrice(
        payoutSummary.requestedPayoutAmount,
        payoutSummary.currency
      ),
    },
    payouts,
    subscribersMetric: {
      ...subscribersMetric,
      displayValue: formatCreatorAnalyticsSummaryMetricValue(subscribersMetric),
    },
  }
}
