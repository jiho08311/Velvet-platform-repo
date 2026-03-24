import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type IsSubscribedInput = {
  userId: string;
  creatorId: string;
};

type SubscriptionRow = {
  id: string;
  current_period_end: string | null;
};

export async function isSubscribed({
  userId,
  creatorId,
}: IsSubscribedInput): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, current_period_end")
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .maybeSingle<SubscriptionRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    return false;
  }

  if (!data.current_period_end) {
    return true;
  }

  return new Date(data.current_period_end) > new Date();
}