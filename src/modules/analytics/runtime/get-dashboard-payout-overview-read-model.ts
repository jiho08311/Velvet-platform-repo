import {
  getCreatorAnalyticsSummaryMetric,
  type CreatorAnalyticsSummaryMetric,
  type CreatorAnalyticsSummaryMetricKey,
} from "@/modules/analytics/policies/creator-analytics-summary-metrics"
import { SUBSCRIBER_COUNT_SURFACE_POLICY } from "@/modules/analytics/policies/subscriber-count-policy"
import { getCreatorAnalyticsSummary } from "@/modules/analytics/runtime/get-creator-analytics"


import {
  getCreatorPayoutSummary,
  listCreatorPayoutExecutions,
} from "@/modules/commerce/public/payout-contract"


type PayoutSummary = NonNullable<
  Awaited<ReturnType<typeof getCreatorPayoutSummary>>
>

type CreatorPayout = Awaited<
  ReturnType<typeof listCreatorPayoutExecutions>
>[number]

const DASHBOARD_SUBSCRIBERS_METRIC_KEY =
  "subscribers" satisfies CreatorAnalyticsSummaryMetricKey

export type DashboardPayoutOverviewReadModel = {
  payoutSummary: PayoutSummary

  /**
   * Canonical dashboard payout history list.
   *
   * This must come from listCreatorPayouts(), not payoutSummary.recentPayouts.
   * Keep the public field name as "payouts" to avoid changing dashboard consumers.
   */
  payouts: CreatorPayout[]

  subscribersMetric: CreatorAnalyticsSummaryMetric
}

export async function getDashboardPayoutOverviewReadModel(
  creatorId: string
): Promise<DashboardPayoutOverviewReadModel | null> {
  const [payoutSummary, payoutHistory, analyticsSummary] = await Promise.all([
  getCreatorPayoutSummary(creatorId),
listCreatorPayoutExecutions({ creatorId }),
    getCreatorAnalyticsSummary(creatorId),
  ])

  if (!payoutSummary) {
    return null
  }

  /**
   * /dashboard intentionally displays the public subscriber metric, not the
   * active subscription metric. Keep this aligned with subscriber count policy
   * so dashboard/profile/public creator surfaces do not drift silently.
   */
  const dashboardSubscriberPolicy =
    SUBSCRIBER_COUNT_SURFACE_POLICY.dashboardSubscribersMetric

  const subscribersMetricKey: CreatorAnalyticsSummaryMetricKey =
    dashboardSubscriberPolicy === "subscriberCount"
      ? DASHBOARD_SUBSCRIBERS_METRIC_KEY
      : DASHBOARD_SUBSCRIBERS_METRIC_KEY

  return {
    payoutSummary,
    payouts: payoutHistory,
    subscribersMetric: getCreatorAnalyticsSummaryMetric(
      analyticsSummary,
      subscribersMetricKey
    ),
  }
}