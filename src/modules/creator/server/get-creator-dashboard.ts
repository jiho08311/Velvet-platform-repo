import { createClient } from "@/infrastructure/supabase/server"
import { resolveSubscriptionState } from "@/modules/subscription/lib/resolve-subscription-state"

export type CreatorDashboard = {
  creatorId: string
  postCount: number
  activeSubscriberCount: number
  earnings: {
    currency: string
    total: number
    monthly: number
  }
}

type SubscriptionRow = {
  status: "incomplete" | "active" | "canceled" | "expired"
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  canceled_at: string | null
}

export async function getCreatorDashboard(
  creatorId: string
): Promise<CreatorDashboard | null> {
  const id = creatorId.trim()

  if (!id) {
    return null
  }

  const supabase = await createClient()

  const [
    postsResult,
    subscriptionsResult,
    monthlyPaymentsResult,
    totalPaymentsResult,
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", id),

    supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end, canceled_at")
      .eq("creator_id", id)
      .returns<SubscriptionRow[]>(),

    supabase
      .from("payments")
      .select("amount, created_at, currency")
      .eq("creator_id", id)
      .eq("status", "succeeded")
      .gte(
        "created_at",
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      ),

    supabase
      .from("payments")
      .select("amount, currency")
      .eq("creator_id", id)
      .eq("status", "succeeded"),
  ])

  if (postsResult.error) throw new Error("Failed to load creator dashboard")
  if (subscriptionsResult.error) throw new Error("Failed to load creator dashboard")
  if (monthlyPaymentsResult.error) throw new Error("Failed to load creator dashboard")
  if (totalPaymentsResult.error) throw new Error("Failed to load creator dashboard")

  const activeSubscriberCount = (subscriptionsResult.data ?? []).filter((row) => {
    const resolved = resolveSubscriptionState({
      status: row.status,
      currentPeriodEndAt: row.current_period_end,
      cancelAtPeriodEnd: row.cancel_at_period_end,
      canceledAt: row.canceled_at,
    })

    return resolved.hasAccess
  }).length

  const monthlyRevenue = (monthlyPaymentsResult.data ?? []).reduce(
    (sum, row) => {
      const amount =
        typeof row.amount === "number"
          ? row.amount
          : Number(row.amount ?? 0)

      return sum + (Number.isFinite(amount) ? amount : 0)
    },
    0
  )

  const totalRevenue = (totalPaymentsResult.data ?? []).reduce(
    (sum, row) => {
      const amount =
        typeof row.amount === "number"
          ? row.amount
          : Number(row.amount ?? 0)

      return sum + (Number.isFinite(amount) ? amount : 0)
    },
    0
  )

  const currency =
    (monthlyPaymentsResult.data?.[0]?.currency ??
      totalPaymentsResult.data?.[0]?.currency ??
      "KRW") as string

  return {
    creatorId: id,
    postCount: postsResult.count ?? 0,
    activeSubscriberCount,
    earnings: {
      currency,
      total: totalRevenue,
      monthly: monthlyRevenue,
    },
  }
}