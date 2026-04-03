import { supabaseAdmin } from "@/infrastructure/supabase/admin";

export async function approvePayoutRequest(payoutRequestId: string) {
  const approvedAt = new Date().toISOString();

  const { data: payoutRequest, error: payoutRequestError } = await supabaseAdmin
    .from("payout_requests")
    .select("id, creator_id, amount, currency, status")
    .eq("id", payoutRequestId)
    .single();

  if (payoutRequestError || !payoutRequest) {
    throw new Error("payout_request not found");
  }

  if (payoutRequest.status !== "pending") {
    throw new Error("already processed payout_request");
  }

  const { data: earnings, error: earningsError } = await supabaseAdmin
    .from("earnings")
    .select("id, payout_id, status")
    .eq("payout_request_id", payoutRequestId)
    .eq("status", "requested");

  if (earningsError) {
    throw new Error(earningsError.message);
  }

  if (!earnings || earnings.length === 0) {
    throw new Error("no earnings for payout_request");
  }

  const alreadyLinked = earnings.find((earning) => earning.payout_id);
  if (alreadyLinked) {
    throw new Error("some earnings already linked to payout");
  }

  const { data: payout, error: payoutError } = await supabaseAdmin
    .from("payouts")
    .insert({
      creator_id: payoutRequest.creator_id,
      payout_request_id: payoutRequest.id,
      amount: payoutRequest.amount,
      currency: payoutRequest.currency,
      status: "pending",
      provider: "mock",
    })
    .select()
    .single();

  if (payoutError || !payout) {
    throw new Error(payoutError?.message || "failed to create payout");
  }

  const { error: updateEarningsError } = await supabaseAdmin
    .from("earnings")
    .update({
      payout_id: payout.id,
    })
    .eq("payout_request_id", payoutRequestId)
    .eq("status", "requested");

  if (updateEarningsError) {
    throw new Error(updateEarningsError.message);
  }

  const { error: updatePayoutRequestError } = await supabaseAdmin
    .from("payout_requests")
    .update({
      status: "approved",
      approved_at: approvedAt,
    })
    .eq("id", payoutRequestId);

  if (updatePayoutRequestError) {
    throw new Error(updatePayoutRequestError.message);
  }

  return payout;
}