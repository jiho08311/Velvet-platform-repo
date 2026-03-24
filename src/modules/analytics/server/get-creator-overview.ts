import { createClient } from "@/infrastructure/supabase/server"

export type CreatorOverview = {
  creatorId: string
  totalPosts: number
  activeSubscribers: number
  monthlyRevenue: number
  totalRevenue: number
}

export async function getCreatorOverview(
  creatorId: string
): Promise<CreatorOverview | null> {
  const id = creatorId.trim()

  if (!id) return null

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
      .select("*", { count: "exact", head: true })
      .eq("creator_id", id)
      .eq("status", "active"),

    supabase
      .from("payments")
      .select("amount_cents, created_at")
      .eq("creator_id", id)
      .eq("status", "succeeded")
      .gte(
        "created_at",
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      ),

    supabase
      .from("payments")
      .select("amount_cents")
      .eq("creator_id", id)
      .eq("status", "succeeded"),
  ])

  if (postsResult.error) throw new Error("Failed to load creator overview")
  if (subscriptionsResult.error) throw new Error("Failed to load creator overview")
  if (monthlyPaymentsResult.error) throw new Error("Failed to load creator overview")
  if (totalPaymentsResult.error) throw new Error("Failed to load creator overview")

  const monthlyRevenue = (monthlyPaymentsResult.data ?? []).reduce(
    (sum, row) => {
      const amount =
        typeof row.amount_cents === "number"
          ? row.amount_cents
          : Number(row.amount_cents ?? 0)

      return sum + (Number.isFinite(amount) ? amount : 0)
    },
    0
  )

  const totalRevenue = (totalPaymentsResult.data ?? []).reduce(
    (sum, row) => {
      const amount =
        typeof row.amount_cents === "number"
          ? row.amount_cents
          : Number(row.amount_cents ?? 0)

      return sum + (Number.isFinite(amount) ? amount : 0)
    },
    0
  )

  return {
    creatorId: id,
    totalPosts: postsResult.count ?? 0,
    activeSubscribers: subscriptionsResult.count ?? 0,
    monthlyRevenue,
    totalRevenue,
  }
}