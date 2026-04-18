import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type MarkPayoutAsFailedParams = {
  payoutId: string;
  failureReason?: string;
};

export async function markPayoutAsFailed({
  payoutId,
  failureReason,
}: MarkPayoutAsFailedParams) {
  const safePayoutId = payoutId.trim();

  if (!safePayoutId) {
    throw new Error("invalid payoutId");
  }

  const { data: payout, error: payoutError } = await supabaseAdmin
    .from("payouts")
    .select("id, status")
    .eq("id", safePayoutId)
    .single();

  if (payoutError || !payout) {
    throw new Error("payout not found");
  }

  if (payout.status === "paid") {
    throw new Error("paid payout cannot be marked as failed");
  }

  const { error: updateError } = await supabaseAdmin
    .from("payouts")
    .update({
      status: "failed",
      failure_reason: failureReason ?? "Marked as failed by admin",
    })
    .eq("id", safePayoutId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    payoutId: safePayoutId,
  };
}