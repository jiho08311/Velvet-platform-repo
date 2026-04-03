import { createClient } from "@/infrastructure/supabase/server"
import type { CreatorDashboardSummary } from "@/modules/analytics/types"

type PaymentRow = {
  id: string
  amount: number | null
  type: "subscription" | "tip" | "ppv_message" | "ppv_post"
  created_at: string
}

export async function getCreatorDashboardSummary(
  creatorId: string
): Promise<CreatorDashboardSummary> {
  const supabase = await createClient()

  const { count: totalCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creatorId)

  const { count: activeCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creatorId)
    .eq("status", "active")

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("id, amount, type, created_at")
    .eq("creator_id", creatorId)
    .eq("status", "succeeded")
    .gte("created_at", startOfMonth.toISOString())
    .order("created_at", { ascending: false })

  if (paymentsError) {
    throw paymentsError
  }

  const paymentRows = (payments ?? []) as PaymentRow[]

  const subscriptionRevenue = paymentRows
    .filter((payment) => payment.type === "subscription")
    .reduce((sum, payment) => sum + (payment.amount ?? 0), 0)

  const ppvPostRevenue = paymentRows
    .filter((payment) => payment.type === "ppv_post")
    .reduce((sum, payment) => sum + (payment.amount ?? 0), 0)

  const ppvMessageRevenue = paymentRows
    .filter((payment) => payment.type === "ppv_message")
    .reduce((sum, payment) => sum + (payment.amount ?? 0), 0)

  const monthlyRevenue =
    subscriptionRevenue + ppvPostRevenue + ppvMessageRevenue

  return {
    subscriberCount: totalCount ?? 0,
    activeSubscriptionCount: activeCount ?? 0,
    monthlyRevenue,
    subscriptionRevenue,
    ppvPostRevenue,
    ppvMessageRevenue,
    recentPayments: paymentRows.map((payment) => ({
      id: payment.id,
      amount: payment.amount ?? 0,
      type: payment.type,
      createdAt: payment.created_at,
    })),
  }
}