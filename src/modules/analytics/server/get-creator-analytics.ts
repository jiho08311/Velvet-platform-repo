import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import {
  buildCreatorAnalyticsSummary,
  type CreatorAnalyticsPaymentType,
  type CreatorAnalyticsRecentPayment,
  type CreatorAnalyticsSummary,
  sumCreatorAnalyticsAmounts,
} from "@/modules/analytics/server/build-creator-analytics-summary"

type CreatorAnalyticsPaymentAmountRow = {
  amount: number | string | null
}

type CreatorAnalyticsPaymentRow = CreatorAnalyticsPaymentAmountRow & {
  id: string
  type: string | null
  created_at: string | null
}

function getStartOfCurrentMonth() {
  const date = new Date()
  date.setDate(1)
  date.setHours(0, 0, 0, 0)

  return date.toISOString()
}

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
  return sumCreatorAnalyticsAmounts(payments.filter((payment) => payment.type === type))
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

export async function getCreatorAnalyticsSummary(
  creatorId: string
): Promise<CreatorAnalyticsSummary> {
  const supabase = await createSupabaseServerClient()
  const startOfMonth = getStartOfCurrentMonth()

  const [
    { count: postCount, error: postCountError },
    { count: subscriberCount, error: subscriberCountError },
    { count: activeSubscriptionCount, error: activeSubscriptionCountError },
    totalPaymentsResult,
    monthlyPaymentsResult,
  ] =
    await Promise.all([
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creatorId)
        .is("deleted_at", null),

      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creatorId),

      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creatorId)
        .eq("status", "active"),

      supabase
        .from("payments")
        .select("amount")
        .eq("creator_id", creatorId)
        .eq("status", "succeeded"),

      supabase
        .from("payments")
        .select("id, amount, type, created_at")
        .eq("creator_id", creatorId)
        .eq("status", "succeeded")
        .gte("created_at", startOfMonth)
        .order("created_at", { ascending: false })
        .returns<CreatorAnalyticsPaymentRow[]>(),
    ])

  if (postCountError) {
    throw postCountError
  }

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
      postCount: postCount ?? 0,
      subscriberCount: subscriberCount ?? 0,
      activeSubscriptionCount: activeSubscriptionCount ?? 0,
    },
    revenue,
    recentPayments: toRecentPayments(monthlyPayments).slice(0, 10),
  })

  return summary
}
