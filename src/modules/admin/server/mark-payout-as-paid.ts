import { supabaseAdmin } from "@/infrastructure/supabase/admin";
import { sendPayout } from "@/modules/payout/server/send-payout";

/**
 * Admin paid adapter only.
 *
 * Responsibility boundary:
 * - accepts admin request-scoped payoutRequestId
 * - resolves payoutRequestId -> payoutId
 * - delegates to canonical payout-domain paid entry
 *
 * This file must never own:
 * - payout execution policy
 * - payout terminal writes
 * - linked earnings paid_out writes
 * - rollback / postcondition logic
 */
async function resolvePayoutIdFromRequestId(
  payoutRequestId: string
): Promise<string> {
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

  return payout.id;
}

export async function markPayoutAsPaid(payoutRequestId: string) {
  const payoutId = await resolvePayoutIdFromRequestId(payoutRequestId);

  await sendPayout({ payoutId });

  return {
    payoutId,
    payoutRequestId: payoutRequestId.trim(),
  };
}