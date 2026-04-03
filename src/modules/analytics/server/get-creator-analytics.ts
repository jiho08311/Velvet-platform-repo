import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type CreatorAnalytics = {
  postCount: number
  subscriberCount: number
  totalRevenue: number
}

export async function getCreatorAnalytics(
  creatorId: string
): Promise<CreatorAnalytics> {
  const supabase = await createSupabaseServerClient()

  const [{ count: postCount }, { count: subscriberCount }, paymentsResult] =
    await Promise.all([
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creatorId)
        .is("deleted_at", null),

      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creatorId)
        .eq("status", "active"),

      supabase
        .from("payments")
        .select("amount")
        .eq("creator_id", creatorId)
        .eq("status", "succeeded"),
    ])

  if (paymentsResult.error) {
    throw paymentsResult.error
  }

  const totalRevenue =
    paymentsResult.data?.reduce(
      (sum, payment) => sum + (payment.amount ?? 0),
      0
    ) ?? 0

  return {
    postCount: postCount ?? 0,
    subscriberCount: subscriberCount ?? 0,
    totalRevenue,
  }
}