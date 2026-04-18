import { supabaseAdmin } from "@/infrastructure/supabase/admin";
import { markPayoutAsFailed as markCanonicalPayoutAsFailed } from "@/modules/payout/server/mark-payout-as-failed";

export async function markPayoutAsFailed(payoutRequestId: string) {
  const safePayoutRequestId = payoutRequestId.trim();

  if (!safePayoutRequestId) {
    throw new Error("invalid payoutRequestId");
  }

  const { data: payout, error: payoutError } = await supabaseAdmin
    .from("payouts")
    .select("id")
    .eq("payout_request_id", safePayoutRequestId)
    .single();

  if (payoutError || !payout) {
    throw new Error("payout not found");
  }

  await markCanonicalPayoutAsFailed({
    payoutId: payout.id,
    failureReason: "Marked as failed by admin",
  });

  return {
    payoutId: payout.id,
    payoutRequestId: safePayoutRequestId,
  };
}