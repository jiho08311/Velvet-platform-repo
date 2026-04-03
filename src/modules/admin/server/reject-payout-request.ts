import { createClient } from "@/infrastructure/supabase/server";

export async function rejectPayoutRequest(payoutRequestId: string) {
  const supabase = await createClient();

  const { data: payoutRequest, error: payoutRequestError } = await supabase
    .from("payout_requests")
    .select("id, status")
    .eq("id", payoutRequestId)
    .single();

  if (payoutRequestError || !payoutRequest) {
    throw new Error("payout_request not found");
  }

  if (payoutRequest.status !== "pending") {
    throw new Error("payout_request is not pending");
  }

  const { data: earnings, error: earningsError } = await supabase
    .from("earnings")
    .select("id, payout_id")
    .eq("payout_request_id", payoutRequestId);

  if (earningsError) {
    throw new Error(earningsError.message);
  }

  if (!earnings || earnings.length === 0) {
    throw new Error("no earnings for payout_request");
  }

  const linkedPayout = earnings.find((earning) => earning.payout_id);
  if (linkedPayout) {
    throw new Error("some earnings are already linked to payout");
  }

  const { error: updateEarningsError } = await supabase
    .from("earnings")
    .update({
      status: "available",
      payout_request_id: null,
    })
    .eq("payout_request_id", payoutRequestId);

  if (updateEarningsError) {
    throw new Error(updateEarningsError.message);
  }

  const { error: updatePayoutRequestError } = await supabase
    .from("payout_requests")
    .update({
      status: "rejected",
    })
    .eq("id", payoutRequestId);

  if (updatePayoutRequestError) {
    throw new Error(updatePayoutRequestError.message);
  }

  return { payoutRequestId };
}