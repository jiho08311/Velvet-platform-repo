import { requireAdmin } from "@/modules/admin/public/require-admin"
import {
  countSucceededPayments,
  listRecentPaymentRows,
  type RecentPaymentRow,
} from "@/modules/payment/repositories/payment-read-repository"
import { getPlatformRevenueSummary } from "@/modules/payout/public/get-platform-revenue-summary"
import {
  countAllActiveSubscriptions,
  countAllSubscriptions,
} from "@/modules/subscription/public/count-subscriptions"

export type AdminAnalytics = {
  totalNetrevenue: number
  availablerevenue: number
  paidOutrevenue: number
  activeSubscriptionsCount: number
  totalSubscriptionsCount: number
  successfulPaymentsCount: number
  recentPayments: RecentPaymentRow[]
}

export async function getAnalytics(): Promise<AdminAnalytics> {
  await requireAdmin()

  const [
    revenueSummary,
    activeSubscriptionsResult,
    totalSubscriptionsResult,
    successfulPaymentsCount,
    recentPayments,
  ] = await Promise.all([
    getPlatformRevenueSummary(),

    countAllActiveSubscriptions(),

    countAllSubscriptions(),

    countSucceededPayments(),

    listRecentPaymentRows(),
  ])

  if (activeSubscriptionsResult.error) throw activeSubscriptionsResult.error
  if (totalSubscriptionsResult.error) throw totalSubscriptionsResult.error

  return {
    totalNetrevenue: revenueSummary.totalNetrevenue,
    availablerevenue: revenueSummary.availablerevenue,
    paidOutrevenue: revenueSummary.paidOutrevenue,
    activeSubscriptionsCount: activeSubscriptionsResult.count ?? 0,
    totalSubscriptionsCount: totalSubscriptionsResult.count ?? 0,
    successfulPaymentsCount: successfulPaymentsCount ?? 0,
    recentPayments: (recentPayments ?? []) as RecentPaymentRow[],
  }
}