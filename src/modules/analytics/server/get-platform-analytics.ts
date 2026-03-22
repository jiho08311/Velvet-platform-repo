import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type PlatformAnalytics = {
  userCount: number
  creatorCount: number
  postCount: number
  totalRevenueCents: number
}

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  const supabase = await createSupabaseServerClient()

  const [
    usersResult,
    creatorsResult,
    postsResult,
    paymentsResult,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),

    supabase.from("creators").select("*", { count: "exact", head: true }),

    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),

    supabase
      .from("payments")
      .select("amount_cents")
      .eq("status", "succeeded"),
  ])

  if (paymentsResult.error) {
    throw paymentsResult.error
  }

  const totalRevenueCents =
    paymentsResult.data?.reduce(
      (sum, payment) => sum + (payment.amount_cents ?? 0),
      0
    ) ?? 0

  return {
    userCount: usersResult.count ?? 0,
    creatorCount: creatorsResult.count ?? 0,
    postCount: postsResult.count ?? 0,
    totalRevenueCents,
  }
}