import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type SubscriptionRow = {
  id: string;
  user_id: string;
  creator_id: string;
  status: "incomplete" | "active" | "canceled" | "expired";
  provider: "toss" | "mock";
  provider_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function cancelSubscription(subscriptionId: string): Promise<{
  id: string;
  userId: string;
  creatorId: string;
  status: "incomplete" | "active" | "canceled" | "expired";
  provider: "toss" | "mock";
  providerSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}> {
  const canceledAt = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: canceledAt,
    })
    .eq("id", subscriptionId)
    .select(
      "id, user_id, creator_id, status, provider, provider_subscription_id, current_period_start, current_period_end, canceled_at, created_at, updated_at"
    )
    .single<SubscriptionRow>();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    creatorId: data.creator_id,
    status: data.status,
    provider: data.provider,
    providerSubscriptionId: data.provider_subscription_id ?? undefined,
    currentPeriodStart: data.current_period_start ?? undefined,
    currentPeriodEnd: data.current_period_end ?? undefined,
    canceledAt: data.canceled_at ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}