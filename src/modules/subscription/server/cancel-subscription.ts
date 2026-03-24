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
  cancel_at_period_end: boolean;
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
  cancelledAt?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}> {
  const cancelledAt = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: cancelledAt,
      cancel_at_period_end: false,
    })
    .eq("id", subscriptionId)
    .select(
      "id, user_id, creator_id, status, provider, provider_subscription_id, current_period_start, current_period_end, canceled_at, cancel_at_period_end, created_at, updated_at"
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
    cancelledAt: data.canceled_at ?? undefined,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}