import { createClient } from "@/infrastructure/supabase/server"

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
    subscribersResult,
    monthlyPaymentsResult,
    totalPaymentsResult,
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", id),

    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", id)
      .eq("status", "active"),

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

  if (postsResult.error) {
    throw new Error("Failed to load creator dashboard")
  }

  if (subscribersResult.error) {
    throw new Error("Failed to load creator dashboard")
  }

  if (monthlyPaymentsResult.error) {
    throw new Error("Failed to load creator dashboard")
  }

  if (totalPaymentsResult.error) {
    throw new Error("Failed to load creator dashboard")
  }

  const monthlyRevenue = (monthlyPaymentsResult.data ?? []).reduce(
    (sum, row) => {
      const amount =
        typeof row.amount === "number" ? row.amount : Number(row.amount ?? 0)

      return sum + (Number.isFinite(amount) ? amount : 0)
    },
    0
  )

  const totalRevenue = (totalPaymentsResult.data ?? []).reduce(
    (sum, row) => {
      const amount =
        typeof row.amount === "number" ? row.amount : Number(row.amount ?? 0)

      return sum + (Number.isFinite(amount) ? amount : 0)
    },
    0
  )

  const currency =
    (monthlyPaymentsResult.data?.[0]?.currency ??
      totalPaymentsResult.data?.[0]?.currency ??
      "USD") as string

  return {
    creatorId: id,
    postCount: postsResult.count ?? 0,
    activeSubscriberCount: subscribersResult.count ?? 0,
    earnings: {
      currency,
      total: totalRevenue,
      monthly: monthlyRevenue,
    },
  }
}