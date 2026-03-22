import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type IsSubscribedInput = {
  userId: string;
  creatorId: string;
};

type SubscriptionRow = {
  id: string;
};

export async function isSubscribed({
  userId,
  creatorId,
}: IsSubscribedInput): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .maybeSingle<SubscriptionRow>();

  if (error) {
    throw error;
  }

  return Boolean(data);
}