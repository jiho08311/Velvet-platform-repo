import { supabaseAdmin } from "@/infrastructure/supabase/admin";

export async function markPayoutAsFailed(payoutRequestId: string) {
  const { data: payoutRequest, error: payoutRequestError } = await supabaseAdmin
    .from("payout_requests")
    .select("id, status")
    .eq("id", payoutRequestId)
    .single();

  if (payoutRequestError || !payoutRequest) {
    throw new Error("payout_request not found");
  }

  if (payoutRequest.status !== "approved") {
    throw new Error("payout_request is not approved");
  }

  const { data: payout, error: payoutError } = await supabaseAdmin
    .from("payouts")
    .select("id, status")
    .eq("payout_request_id", payoutRequestId)
    .single();

  if (payoutError || !payout) {
    throw new Error("payout not found");
  }

  if (payout.status === "paid") {
    throw new Error("paid payout cannot be marked as failed");
  }

  const { data: earnings, error: earningsError } = await supabaseAdmin
    .from("earnings")
    .select("id")
    .eq("payout_request_id", payoutRequestId)
    .eq("payout_id", payout.id);

  if (earningsError) {
    throw new Error(earningsError.message);
  }

  if (!earnings || earnings.length === 0) {
    throw new Error("no earnings linked to payout");
  }

  const { error: updatePayoutError } = await supabaseAdmin
    .from("payouts")
    .update({
      status: "failed",
    })
    .eq("id", payout.id);

  if (updatePayoutError) {
    throw new Error(updatePayoutError.message);
  }

  const { error: updatePayoutRequestError } = await supabaseAdmin
    .from("payout_requests")
    .update({
      status: "pending",
    })
    .eq("id", payoutRequestId);

  if (updatePayoutRequestError) {
    throw new Error(updatePayoutRequestError.message);
  }

  const { error: updateEarningsError } = await supabaseAdmin
    .from("earnings")
    .update({
      status: "available",
      payout_id: null,
      payout_request_id: null,
    })
    .eq("payout_request_id", payoutRequestId)
    .eq("payout_id", payout.id);

  if (updateEarningsError) {
    throw new Error(updateEarningsError.message);
  }

  return {
    payoutId: payout.id,
    payoutRequestId,
  };
}