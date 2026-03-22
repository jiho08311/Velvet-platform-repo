import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type UpdateCreatorInput = {
  creatorId: string
  status?: "pending" | "active" | "suspended"
  subscriptionPriceCents?: number
  subscriptionCurrency?: string
}

type CreatorRow = {
  id: string
  user_id: string
  status: "pending" | "active" | "suspended"
  subscription_price_cents: number
  subscription_currency: string
  created_at: string
  updated_at: string
}

export async function updateCreator({
  creatorId,
  status,
  subscriptionPriceCents,
  subscriptionCurrency,
}: UpdateCreatorInput): Promise<{
  id: string
  userId: string
  status: "pending" | "active" | "suspended"
  subscriptionPriceCents: number
  subscriptionCurrency: string
  createdAt: string
  updatedAt: string
}> {
  const updateData: Record<string, unknown> = {}

  if (status !== undefined) {
    updateData.status = status
  }

  if (subscriptionPriceCents !== undefined) {
    updateData.subscription_price_cents = subscriptionPriceCents
  }

  if (subscriptionCurrency !== undefined) {
    updateData.subscription_currency = subscriptionCurrency
  }

  const { data, error } = await supabaseAdmin
    .from("creators")
    .update(updateData)
    .eq("id", creatorId)
    .select(
      "id, user_id, status, subscription_price_cents, subscription_currency, created_at, updated_at"
    )
    .single<CreatorRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    status: data.status,
    subscriptionPriceCents: data.subscription_price_cents,
    subscriptionCurrency: data.subscription_currency,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}