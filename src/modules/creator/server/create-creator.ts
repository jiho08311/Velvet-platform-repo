import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreateCreatorInput = {
  userId: string
  instagramUsername?: string
}

type CreatorRow = {
  id: string
  user_id: string
  status: "pending" | "active" | "suspended"
  subscription_price: number
  subscription_currency: string
  instagram_username: string | null
  created_at: string
  updated_at: string
}

export async function createCreator({
  userId,
  instagramUsername,
}: CreateCreatorInput): Promise<{
  id: string
  userId: string
  status: "pending" | "active" | "suspended"
  subscriptionPrice: number
  subscriptionCurrency: string
  instagramUsername: string | null
  createdAt: string
  updatedAt: string
}> {
  const { error: userError } = await supabaseAdmin
    .from("profiles")
    .update({ role: "pending_creator" })
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
      instagram_username: instagramUsername ?? null,
    })
    .select(
      "id, user_id, status, subscription_price, subscription_currency, instagram_username, created_at, updated_at"
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
    instagramUsername: data.instagram_username,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}