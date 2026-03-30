import { requireAdmin } from "@/modules/admin/server/require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type RecentPaymentRow = {
  id: string
  user_id: string
  creator_id: string | null
  type: string
  status: string
  amount_cents: number
  currency: string
  created_at: string
}

export type AdminAnalytics = {
  totalNetRevenueCents: number
  availableRevenueCents: number
  paidOutRevenueCents: number
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
      .select("net_amount_cents, status"),

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
      .select("id, user_id, creator_id, type, status, amount_cents, currency, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  if (earningsResult.error) throw earningsResult.error
  if (activeSubscriptionsResult.error) throw activeSubscriptionsResult.error
  if (totalSubscriptionsResult.error) throw totalSubscriptionsResult.error
  if (successfulPaymentsResult.error) throw successfulPaymentsResult.error
  if (recentPaymentsResult.error) throw recentPaymentsResult.error

  const earnings = earningsResult.data ?? []

  const totalNetRevenueCents = earnings.reduce(
    (sum, row) => sum + (row.net_amount_cents ?? 0),
    0
  )

  const availableRevenueCents = earnings
    .filter((row) => row.status === "available")
    .reduce((sum, row) => sum + (row.net_amount_cents ?? 0), 0)

  const paidOutRevenueCents = earnings
    .filter((row) => row.status === "paid_out")
    .reduce((sum, row) => sum + (row.net_amount_cents ?? 0), 0)

  return {
    totalNetRevenueCents,
    availableRevenueCents,
    paidOutRevenueCents,
    activeSubscriptionsCount: activeSubscriptionsResult.count ?? 0,
    totalSubscriptionsCount: totalSubscriptionsResult.count ?? 0,
    successfulPaymentsCount: successfulPaymentsResult.count ?? 0,
    recentPayments: (recentPaymentsResult.data ?? []) as RecentPaymentRow[],
  }
}