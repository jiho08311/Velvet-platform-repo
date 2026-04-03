import { requireAdmin } from "@/modules/admin/server/require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type RecentPaymentRow = {
  id: string
  user_id: string
  creator_id: string | null
  type: string
  status: string
  amount: number
  currency: string
  created_at: string
}

export type AdminAnalytics = {
  totalNetrevenue: number
  availablerevenue: number
  paidOutrevenue: number
  activeSubscriptionsCount: number
  totalSubscriptionsCount: number
  successfulPaymentsCount: number
  recentPayments: RecentPaymentRow[]
}

export async function getAnalytics(): Promise<AdminAnalytics> {
  await requireAdmin()

  const [
    earningsResult,
    activeSubscriptionsResult,
    totalSubscriptionsResult,
    successfulPaymentsResult,
    recentPaymentsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("earnings")
      .select("net_amount, status"),

    supabaseAdmin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),

    supabaseAdmin
      .from("subscriptions")
      .select("*", { count: "exact", head: true }),

    supabaseAdmin
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "succeeded"),

    supabaseAdmin
      .from("payments")
      .select("id, user_id, creator_id, type, status, amount, currency, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  if (earningsResult.error) throw earningsResult.error
  if (activeSubscriptionsResult.error) throw activeSubscriptionsResult.error
  if (totalSubscriptionsResult.error) throw totalSubscriptionsResult.error
  if (successfulPaymentsResult.error) throw successfulPaymentsResult.error
  if (recentPaymentsResult.error) throw recentPaymentsResult.error

  const earnings = earningsResult.data ?? []

  const totalNetrevenue = earnings.reduce(
    (sum, row) => sum + (row.net_amount ?? 0),
    0
  )

  const availablerevenue = earnings
    .filter((row) => row.status === "available")
    .reduce((sum, row) => sum + (row.net_amount ?? 0), 0)

  const paidOutrevenue = earnings
    .filter((row) => row.status === "paid_out")
    .reduce((sum, row) => sum + (row.net_amount ?? 0), 0)

  return {
    totalNetrevenue,
    availablerevenue,
    paidOutrevenue,
    activeSubscriptionsCount: activeSubscriptionsResult.count ?? 0,
    totalSubscriptionsCount: totalSubscriptionsResult.count ?? 0,
    successfulPaymentsCount: successfulPaymentsResult.count ?? 0,
    recentPayments: (recentPaymentsResult.data ?? []) as RecentPaymentRow[],
  }
}