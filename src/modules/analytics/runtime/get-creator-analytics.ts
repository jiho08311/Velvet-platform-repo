import {
  buildCreatorAnalyticsSummary,
  type CreatorAnalyticsPaymentType,
  type CreatorAnalyticsRecentPayment,
  type CreatorAnalyticsSummary,
  sumCreatorAnalyticsAmounts,
} from "@/modules/analytics/mappers/build-creator-analytics-summary"
import { getCreatorAnalyticsPeriodStart } from "@/modules/analytics/policies/creator-analytics-period"

import { countCreatorVisibleContentPosts } from "@/modules/post/public/post-analytics-read-model"

import {
  countCreatorActiveSubscriptionsReadModel,
  countCreatorSubscriptionsReadModel,
  listCreatorAnalyticsPaymentsReadModel,
} from "@/modules/commerce/public/commerce-analytics-contract"

type CreatorAnalyticsPaymentResult = Awaited<
  ReturnType<typeof listCreatorAnalyticsPaymentsReadModel>
>

type CreatorAnalyticsPaymentAmountRow = NonNullable<
  CreatorAnalyticsPaymentResult["totalPaymentsResult"]["data"]
>[number]

type CreatorAnalyticsPaymentRow = NonNullable<
  CreatorAnalyticsPaymentResult["monthlyPaymentsResult"]["data"]
>[number]


function isCreatorAnalyticsPaymentType(
  type: string | null
): type is CreatorAnalyticsPaymentType {
  return (
    type === "subscription" ||
    type === "tip" ||
    type === "ppv_message" ||
    type === "ppv_post"
  )
}

function sumPaymentsByType(
  payments: CreatorAnalyticsPaymentRow[],
  type: CreatorAnalyticsPaymentType
) {
  return sumCreatorAnalyticsAmounts(
    payments.filter((payment) => payment.type === type)
  )
}

function toRecentPayments(
  payments: CreatorAnalyticsPaymentRow[]
): CreatorAnalyticsRecentPayment[] {
  return payments.flatMap((payment) => {
    if (!isCreatorAnalyticsPaymentType(payment.type)) {
      return []
    }

    return [
      {
        id: payment.id,
        amount: sumCreatorAnalyticsAmounts([payment]),
        type: payment.type,
        createdAt: payment.created_at ?? new Date(0).toISOString(),
      },
    ]
  })
}

/**
 * Canonical creator analytics dashboard summary reader.
 *
 * Use this reader for /creator/dashboard analytics surfaces that need:
 * - post count
 * - subscriber counts
 * - active subscription count
 * - total/current-period revenue
 * - recent payment analytics
 *
 * This reader owns analytics calculations only. It must not become the
 * operational dashboard contract for payout balance, payout history, payout
 * request eligibility, or creator subscription settings display.
 *
 * /dashboard operational surfaces should use getDashboardMainReadModel().
 * /creator/dashboard analytics surfaces should use this reader directly unless
 * the route contract is explicitly changed.
 */
export async function getCreatorAnalyticsSummary(
  creatorId: string
): Promise<CreatorAnalyticsSummary> {
  const periodStart = getCreatorAnalyticsPeriodStart()

  const [
    postCount,
    { count: subscriberCount, error: subscriberCountError },
    { count: activeSubscriptionCount, error: activeSubscriptionCountError },
    paymentAnalyticsResult,
  ] = await Promise.all([
    countCreatorVisibleContentPosts(creatorId),

countCreatorSubscriptionsReadModel(creatorId),
countCreatorActiveSubscriptionsReadModel(creatorId),
listCreatorAnalyticsPaymentsReadModel({ creatorId, periodStart }),
  ])

  const { totalPaymentsResult, monthlyPaymentsResult } = paymentAnalyticsResult

  if (subscriberCountError) {
    throw subscriberCountError
  }

  if (activeSubscriptionCountError) {
    throw activeSubscriptionCountError
  }

  if (totalPaymentsResult.error) {
    throw totalPaymentsResult.error
  }

  if (monthlyPaymentsResult.error) {
    throw monthlyPaymentsResult.error
  }

  const totalPayments =
    (totalPaymentsResult.data ?? []) as CreatorAnalyticsPaymentAmountRow[]
  const monthlyPayments = monthlyPaymentsResult.data ?? []
  const revenue = {
    totalRevenue: sumCreatorAnalyticsAmounts(totalPayments),
    monthlyRevenue: sumCreatorAnalyticsAmounts(monthlyPayments),
    subscriptionRevenue: sumPaymentsByType(monthlyPayments, "subscription"),
    ppvPostRevenue: sumPaymentsByType(monthlyPayments, "ppv_post"),
    ppvMessageRevenue: sumPaymentsByType(monthlyPayments, "ppv_message"),
  }

  const summary = buildCreatorAnalyticsSummary({
    counts: {
      postCount,
      subscriberCount: subscriberCount ?? 0,
      activeSubscriptionCount: activeSubscriptionCount ?? 0,
    },
    revenue,
    recentPayments: toRecentPayments(monthlyPayments).slice(0, 10),
  })

  return summary
}