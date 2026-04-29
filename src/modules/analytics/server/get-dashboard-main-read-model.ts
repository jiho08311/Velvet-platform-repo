import {
  formatCreatorAnalyticsSummaryMetricValue,
} from "@/modules/analytics/lib/creator-analytics-summary-metrics"
import {
  getDashboardPayoutOverviewReadModel,
  type DashboardPayoutOverviewReadModel,
} from "@/modules/analytics/server/get-dashboard-payout-overview-read-model"
import { formatPayoutCurrencyAmount } from "@/modules/payout/lib/payout-display-format"

type DashboardMainCreator = {
  id: string
  username: string
  subscriptionPrice: number
}
/**
 * Canonical creator operational dashboard read model.
 *
 * Use this read model for /dashboard surfaces that need the creator's
 * operational dashboard contract:
 * - creator subscription settings display
 * - payout balance summary
 * - creator-facing payout history
 * - dashboard subscriber metric
 *
 * This is not the canonical analytics dashboard read model for
 * /creator/dashboard. Analytics dashboard surfaces should continue to use
 * getCreatorAnalyticsSummary() directly unless the route contract is
 * explicitly changed.
 *
 * Source-of-truth boundary:
 * - payout summary comes from getDashboardPayoutOverviewReadModel()
 * - payout history must remain sourced from listCreatorPayouts()
 * - subscriber metric is projected from getCreatorAnalyticsSummary()
 *
 * Do not add route access policy here. Route access/readiness policy belongs
 * to the app route or creator readiness helpers.
 */
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
      displaySubscriptionPrice: formatPayoutCurrencyAmount(
        creator.subscriptionPrice
      ),
    },
    payoutSummary: {
      ...payoutSummary,
      displayRequestableBalance: formatPayoutCurrencyAmount(
        payoutSummary.requestableBalance,
        payoutSummary.currency
      ),
      displayRequestedPayoutAmount: formatPayoutCurrencyAmount(
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
