import { createClient } from "@/infrastructure/supabase/server"

export type AdminAnalyticsSummary = {
  totalUsers: number
  totalRevenue: number
  activeCreators: number
  openReports: number
  currency?: string
}

export async function getAdminAnalytics(): Promise<AdminAnalyticsSummary> {
  const supabase = await createClient()

  const [
    usersResult,
    creatorsResult,
    reportsResult,
    paymentsResult,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("creators")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "succeeded"),
  ])

  if (usersResult.error) {
    throw new Error("Failed to load analytics")
  }

  if (creatorsResult.error) {
    throw new Error("Failed to load analytics")
  }

  if (reportsResult.error) {
    throw new Error("Failed to load analytics")
  }

  if (paymentsResult.error) {
    throw new Error("Failed to load analytics")
  }

  const totalRevenue = (paymentsResult.data ?? []).reduce((sum, row) => {
    const amount =
      typeof row.amount === "number" ? row.amount : Number(row.amount ?? 0)

    return sum + (Number.isFinite(amount) ? amount : 0)
  }, 0)

  return {
    totalUsers: usersResult.count ?? 0,
    totalRevenue,
    activeCreators: creatorsResult.count ?? 0,
    openReports: reportsResult.count ?? 0,
    currency: "USD",
  }
}