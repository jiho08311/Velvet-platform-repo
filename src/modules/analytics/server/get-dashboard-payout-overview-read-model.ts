import {
  getCreatorAnalyticsSummaryMetric,
  type CreatorAnalyticsSummaryMetric,
} from "@/modules/analytics/lib/creator-analytics-summary-metrics"
import { getCreatorAnalyticsSummary } from "@/modules/analytics/server/get-creator-analytics"
import {
  getPayoutSummary,
  type PayoutSummary,
} from "@/modules/payout/server/get-payout-summary"
import {
  listCreatorPayouts,
  type CreatorPayout,
} from "@/modules/payout/server/list-creator-payouts"

export type DashboardPayoutOverviewReadModel = {
  payoutSummary: PayoutSummary
  payouts: CreatorPayout[]
  subscribersMetric: CreatorAnalyticsSummaryMetric
}

export async function getDashboardPayoutOverviewReadModel(
  creatorId: string
): Promise<DashboardPayoutOverviewReadModel | null> {
  const [payoutSummary, payouts, analyticsSummary] = await Promise.all([
    getPayoutSummary(creatorId),
    listCreatorPayouts({ creatorId }),
    getCreatorAnalyticsSummary(creatorId),
  ])

  if (!payoutSummary) {
    return null
  }

  return {
    payoutSummary,
    payouts,
    subscribersMetric: getCreatorAnalyticsSummaryMetric(
      analyticsSummary,
      "subscribers"
    ),
  }
}
