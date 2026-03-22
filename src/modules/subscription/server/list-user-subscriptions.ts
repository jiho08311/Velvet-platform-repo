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

type ListUserSubscriptionsInput = {
  userId: string;
  status?: "incomplete" | "active" | "canceled" | "expired";
};

export async function listUserSubscriptions({
  userId,
  status,
}: ListUserSubscriptionsInput): Promise<
  Array<{
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
  }>
> {
  let query = supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, creator_id, status, provider, provider_subscription_id, current_period_start, current_period_end, canceled_at, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.returns<SubscriptionRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((subscription) => ({
    id: subscription.id,
    userId: subscription.user_id,
    creatorId: subscription.creator_id,
    status: subscription.status,
    provider: subscription.provider,
    providerSubscriptionId:
      subscription.provider_subscription_id ?? undefined,
    currentPeriodStart: subscription.current_period_start ?? undefined,
    currentPeriodEnd: subscription.current_period_end ?? undefined,
    canceledAt: subscription.canceled_at ?? undefined,
    createdAt: subscription.created_at,
    updatedAt: subscription.updated_at,
  }));
}