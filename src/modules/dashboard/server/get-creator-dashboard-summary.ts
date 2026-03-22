import { createServerSupabaseClient } from "@/infrastructure/supabase/server"

type PaymentRow = {
  id: string
  amount_cents: number | null
  created_at: string | null
  status: string | null
}

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export async function getCreatorDashboardSummary(creatorId: string) {
  const supabase = await createServerSupabaseClient()
  const { start, end } = getMonthRange()

  const [
    subscriberCountResult,
    monthlyPaymentsResult,
    recentPaymentsResult,
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("payments")
      .select("amount_cents")
      .eq("creator_id", creatorId)
      .eq("status", "succeeded")
      .gte("created_at", start)
      .lt("created_at", end),

    supabase
      .from("payments")
      .select("id, amount_cents, created_at, status")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  console.log("subscriberCountResult >>>", subscriberCountResult)

  if (subscriberCountResult.error) {
    throw new Error(
      `Failed to fetch subscriber count: ${JSON.stringify(subscriberCountResult.error)}`
    )
  }

  if (monthlyPaymentsResult.error) {
    throw new Error(
      `Failed to fetch monthly payments: ${JSON.stringify(monthlyPaymentsResult.error)}`
    )
  }

  if (recentPaymentsResult.error) {
    throw new Error(
      `Failed to fetch recent payments: ${JSON.stringify(recentPaymentsResult.error)}`
    )
  }

  const monthlyRevenue =
    monthlyPaymentsResult.data?.reduce((sum, payment) => {
      return sum + (payment.amount_cents ?? 0)
    }, 0) ?? 0

  const recentPayments: PaymentRow[] = recentPaymentsResult.data ?? []

  return {
    subscriberCount: subscriberCountResult.count ?? 0,
    monthlyRevenue,
    monthlyRevenueFormatted: (monthlyRevenue / 100).toFixed(2),
    recentPaymentCount: recentPayments.length,
    recentPayments,
  }
}