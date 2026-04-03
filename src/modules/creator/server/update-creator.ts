import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type UpdateCreatorInput = {
  creatorId: string;
  status?: "pending" | "active" | "suspended";
  subscriptionPrice?: number;
  subscriptionCurrency?: string;
};

type CreatorRow = {
  id: string;
  user_id: string;
  status: "pending" | "active" | "suspended";
  subscription_price: number;
  subscription_currency: string;
  created_at: string;
  updated_at: string;
};

function isValidSubscriptionPrice(price: number) {
  if (!Number.isInteger(price)) return false;
  if (price <= 0) return false;
  if (price > 10_000_000) return false;
  return true;
}

export async function updateCreator({
  creatorId,
  status,
  subscriptionPrice,
  subscriptionCurrency,
}: UpdateCreatorInput): Promise<{
  id: string;
  userId: string;
  status: "pending" | "active" | "suspended";
  subscriptionPrice: number;
  subscriptionCurrency: string;
  createdAt: string;
  updatedAt: string;
}> {
  const updateData: Record<string, unknown> = {};

  if (status !== undefined) {
    updateData.status = status;
  }

  if (subscriptionPrice !== undefined) {
    if (!isValidSubscriptionPrice(subscriptionPrice)) {
      throw new Error("Invalid subscription price");
    }

    updateData.subscription_price = subscriptionPrice;
  }

  if (subscriptionCurrency !== undefined) {
    updateData.subscription_currency = subscriptionCurrency;
  }

  const { data, error } = await supabaseAdmin
    .from("creators")
    .update(updateData)
    .eq("id", creatorId)
    .select(
      "id, user_id, status, subscription_price, subscription_currency, created_at, updated_at"
    )
    .single<CreatorRow>();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    status: data.status,
    subscriptionPrice: data.subscription_price,
    subscriptionCurrency: data.subscription_currency,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}