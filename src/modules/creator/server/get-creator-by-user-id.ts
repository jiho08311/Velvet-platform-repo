import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreatorRow = {
  id: string
  user_id: string
  username: string | null
  status: "pending" | "active" | "suspended"
  subscription_price_cents: number | null
  subscription_currency: string | null
  created_at: string
  updated_at: string
}

export async function getCreatorByUserId(userId: string) {
  const resolvedUserId = userId.trim()

  if (!resolvedUserId) {
    return null
  }

  const { data, error } = await supabaseAdmin
    .from("creators")
    .select(
      `
      id,
      user_id,
      username,
      status,
      subscription_price_cents,
      subscription_currency,
      created_at,
      updated_at
      `
    )
    .eq("user_id", resolvedUserId)
    .maybeSingle<CreatorRow>()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    username: data.username ?? "",
    status: data.status,
    subscriptionPriceCents: data.subscription_price_cents ?? 0,
    subscriptionCurrency: data.subscription_currency ?? "KRW",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}