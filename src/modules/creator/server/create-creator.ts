import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreateCreatorInput = {
  userId: string
}

type CreatorRow = {
  id: string
  user_id: string
  status: "pending" | "active" | "suspended"
  subscription_price: number
  subscription_currency: string
  created_at: string
  updated_at: string
}

export async function createCreator({
  userId,
}: CreateCreatorInput): Promise<{
  id: string
  userId: string
  status: "pending" | "active" | "suspended"
  subscriptionPrice: number
  subscriptionCurrency: string
  createdAt: string
  updatedAt: string
}> {
  const { error: userError } = await supabaseAdmin
    .from("profiles")
    .update({ role: "creator" })
    .eq("id", userId)

  if (userError) {
    throw userError
  }

  const { data, error } = await supabaseAdmin
    .from("creators")
    .insert({
      user_id: userId,
      status: "pending",
      subscription_price: 0,
      subscription_currency: "KRW",
    })
    .select(
      "id, user_id, status, subscription_price, subscription_currency, created_at, updated_at"
    )
    .single<CreatorRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    status: data.status,
    subscriptionPrice: data.subscription_price,
    subscriptionCurrency: data.subscription_currency,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}