export type CreatorAnalyticsPaymentType =
  | "subscription"
  | "tip"
  | "ppv_message"
  | "ppv_post"

export type CreatorAnalyticsRecentPayment = {
  id: string
  amount: number
  type: CreatorAnalyticsPaymentType
  createdAt: string
}

export type CreatorAnalyticsSummary = {
  counts: {
    postCount: number
    subscriberCount: number
    activeSubscriptionCount: number
  }
  revenue: {
    totalRevenue: number
    monthlyRevenue: number
    subscriptionRevenue: number
    ppvPostRevenue: number
    ppvMessageRevenue: number
    grossRevenue: number
    netRevenue: number
    fees: number
  }
  engagement: {
    label: string
  }
  recentPayments: CreatorAnalyticsRecentPayment[]
}

type CreatorAnalyticsSummaryInput = Partial<{
  counts: Partial<CreatorAnalyticsSummary["counts"]>
  revenue: Partial<CreatorAnalyticsSummary["revenue"]>
  engagement: Partial<CreatorAnalyticsSummary["engagement"]>
  recentPayments: CreatorAnalyticsRecentPayment[]
}>

const DEFAULT_ENGAGEMENT_LABEL = "No engagement data"

function readFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const normalized = Number(value)

    if (Number.isFinite(normalized)) {
      return normalized
    }
  }

  return null
}

function toFiniteNumber(value: unknown) {
  return readFiniteNumber(value) ?? 0
}

export function sumCreatorAnalyticsAmounts<T extends { amount: unknown }>(
  rows: T[]
) {
  return rows.reduce((sum, row) => sum + toFiniteNumber(row.amount), 0)
}

export function buildCreatorAnalyticsSummary(
  input: CreatorAnalyticsSummaryInput = {}
): CreatorAnalyticsSummary {
  const subscriptionRevenue = toFiniteNumber(input.revenue?.subscriptionRevenue)
  const ppvPostRevenue = toFiniteNumber(input.revenue?.ppvPostRevenue)
  const ppvMessageRevenue = toFiniteNumber(input.revenue?.ppvMessageRevenue)
  const totalRevenue = toFiniteNumber(input.revenue?.totalRevenue)
  const grossRevenueInput = readFiniteNumber(input.revenue?.grossRevenue)
  const netRevenueInput = readFiniteNumber(input.revenue?.netRevenue)
  const feesInput = readFiniteNumber(input.revenue?.fees)
  const monthlyRevenueInput = readFiniteNumber(input.revenue?.monthlyRevenue)

  const grossRevenue = grossRevenueInput ?? totalRevenue
  const netRevenue = netRevenueInput ?? grossRevenue
  const fees = feesInput ?? Math.max(grossRevenue - netRevenue, 0)
  const monthlyRevenue =
    monthlyRevenueInput ??
    subscriptionRevenue + ppvPostRevenue + ppvMessageRevenue

  return {
    counts: {
      postCount: toFiniteNumber(input.counts?.postCount),
      subscriberCount: toFiniteNumber(input.counts?.subscriberCount),
      activeSubscriptionCount: toFiniteNumber(
        input.counts?.activeSubscriptionCount
      ),
    },
    revenue: {
      totalRevenue,
      monthlyRevenue,
      subscriptionRevenue,
      ppvPostRevenue,
      ppvMessageRevenue,
      grossRevenue,
      netRevenue,
      fees,
    },
    engagement: {
      label:
        typeof input.engagement?.label === "string" &&
        input.engagement.label.length > 0
          ? input.engagement.label
          : DEFAULT_ENGAGEMENT_LABEL,
    },
    recentPayments: input.recentPayments ?? [],
  }
}
