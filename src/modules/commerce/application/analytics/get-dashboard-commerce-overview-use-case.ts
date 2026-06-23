import {
  listCanonicalCreatorDashboardPayments,
  listCanonicalCreatorDashboardSubscriptionStates,
  resolveCanonicalSubscriptionAccess,
} from "@/modules/commerce/internal/adapters/commerce-analytics-adapter"
import type {
  DashboardCommerceOverview,
  DashboardCommerceOverviewInput,
} from "@/modules/commerce/public/commerce-analytics-contract"
import type { CommerceCurrency, Money } from "@/modules/commerce/public/types"

function toCommerceCurrency(currency: string | null | undefined): CommerceCurrency {
  if (!currency || currency === "KRW") {
    return "KRW"
  }

  throw new Error(`Unsupported commerce currency: ${currency}`)
}

function money(amount: number, currency: CommerceCurrency): Money {
  return {
    amount,
    currency,
  }
}

function toAmount(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

export async function getDashboardCommerceOverviewUseCase({
  creatorId,
}: DashboardCommerceOverviewInput): Promise<DashboardCommerceOverview> {
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString()

  const [subscriptions, dashboardPaymentsResult] = await Promise.all([
    listCanonicalCreatorDashboardSubscriptionStates(creatorId),
    listCanonicalCreatorDashboardPayments({
      creatorId,
      monthStart,
    }),
  ])

  if (dashboardPaymentsResult.monthlyError) {
    throw new Error("Failed to load dashboard commerce overview")
  }

  if (dashboardPaymentsResult.totalError) {
    throw new Error("Failed to load dashboard commerce overview")
  }

  const activeCount = (subscriptions ?? []).filter((row) => {
    const resolved = resolveCanonicalSubscriptionAccess({
      status: row.status,
      currentPeriodEndAt: row.current_period_end,
      cancelAtPeriodEnd: row.cancel_at_period_end,
      canceledAt: row.canceled_at,
    })

    return resolved.hasAccess
  }).length

  const monthlyGross = (dashboardPaymentsResult.monthlyPayments ?? []).reduce(
    (sum, row) => sum + toAmount(row.amount),
    0
  )

  const totalGross = (dashboardPaymentsResult.totalPayments ?? []).reduce(
    (sum, row) => sum + toAmount(row.amount),
    0
  )

  const currency = toCommerceCurrency(
    dashboardPaymentsResult.monthlyPayments?.[0]?.currency ??
      dashboardPaymentsResult.totalPayments?.[0]?.currency
  )

  return {
    creatorId,
  revenue: {
  gross: money(totalGross, currency),
  monthlyGross: money(monthlyGross, currency),
  net: money(totalGross, currency),
  platformFee: money(0, currency),
},
    payments: {
      recentCount: dashboardPaymentsResult.monthlyPayments?.length ?? 0,
      succeededCount: dashboardPaymentsResult.totalPayments?.length ?? 0,
    },
    subscriptions: {
      activeCount,
      endingCount: 0,
    },
    payouts: {
      pendingAmount: money(0, currency),
      paidAmount: money(0, currency),
    },
  }
}