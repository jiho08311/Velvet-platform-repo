import { supabaseAdmin } from "@/infrastructure/supabase/admin";

export async function checkSubscription({
  userId,
  creatorId,
}: {
  userId: string;
  creatorId: string;
}): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.error("checkSubscription error:", error);
    return false;
  }

  return data.status === "active" || data.status === "trialing";
}