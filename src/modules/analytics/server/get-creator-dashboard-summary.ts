import { createClient } from "@/infrastructure/supabase/server"
import type { CreatorDashboardSummary } from "@/modules/analytics/types"

export async function getCreatorDashboardSummary(
  creatorId: string
): Promise<CreatorDashboardSummary> {
  const supabase = await createClient()

  // 전체 구독자 수
  const { count: totalCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creatorId)

  // 활성 구독자 수
  const { count: activeCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creatorId)
    .eq("status", "active")

  // 월 수익
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: payments } = await supabase
    .from("payments")
    .select("amount_cents")
    .eq("creator_id", creatorId)
    .eq("status", "succeeded")
    .gte("created_at", startOfMonth.toISOString())

  const monthlyRevenueCents =
    payments?.reduce((sum, p) => sum + (p.amount_cents ?? 0), 0) ?? 0

  return {
    subscriberCount: totalCount ?? 0,
    activeSubscriberCount: activeCount ?? 0,
    monthlyRevenueCents,
  }
}