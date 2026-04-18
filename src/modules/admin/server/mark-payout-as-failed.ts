import { supabaseAdmin } from "@/infrastructure/supabase/admin";
import { markPayoutAsFailed as markCanonicalPayoutAsFailed } from "@/modules/payout/server/mark-payout-as-failed";

/**
 * Admin failed adapter only.
 *
 * Responsibility boundary:
 * - accepts admin request-scoped payoutRequestId
 * - resolves payoutRequestId -> payoutId
 * - delegates to canonical payout-domain failed entry
 *
 * This file must never own:
 * - payout execution policy
 * - payout terminal writes
 * - linked earnings failed/release writes
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

export async function markPayoutAsFailed(payoutRequestId: string) {
  const safePayoutRequestId = payoutRequestId.trim();
  const payoutId = await resolvePayoutIdFromRequestId(safePayoutRequestId);

  await markCanonicalPayoutAsFailed({
    payoutId,
    failureReason: "Marked as failed by admin",
  });

  return {
    payoutId,
    payoutRequestId: safePayoutRequestId,
  };
}