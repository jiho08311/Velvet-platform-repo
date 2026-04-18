import { supabaseAdmin } from "@/infrastructure/supabase/admin";
import { sendPayout } from "@/modules/payout/server/send-payout";

export async function markPayoutAsPaid(payoutRequestId: string) {
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

  await sendPayout({
    payoutId: payout.id,
  });

  return {
    payoutId: payout.id,
    payoutRequestId: safePayoutRequestId,
  };
}