import { supabaseAdmin } from "@/infrastructure/supabase/admin";
import { getCreatorBalance } from "./get-creator-balance";

type CreatePayoutRequestInput = {
  creatorId: string;
  amount: number;
  currency?: string;
};

type AvailableEarningRow = {
  id: string;
  net_amount: number;
};

export async function createPayoutRequest(
  input: CreatePayoutRequestInput
) {
  const creatorId = input.creatorId.trim();

  if (!creatorId) {
    throw new Error("Creator id is required");
  }

  if (input.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const balance = await getCreatorBalance({ creatorId });

  if (input.amount > balance.availableBalance) {
    throw new Error("INSUFFICIENT_AVAILABLE_BALANCE");
  }

  const currency = input.currency?.trim().toUpperCase() || "KRW";

  const { data: earnings, error: earningsError } = await supabaseAdmin
    .from("earnings")
    .select("id, net_amount")
    .eq("creator_id", creatorId)
    .eq("status", "available")
    .is("payout_request_id", null)
    .is("payout_id", null)
    .order("created_at", { ascending: true })
    .returns<AvailableEarningRow[]>();

  if (earningsError) {
    throw earningsError;
  }

  let remaining = input.amount;
  const selectedEarningIds: string[] = [];

  for (const earning of earnings ?? []) {
    if (remaining <= 0) break;

    if (earning.net_amount > remaining && selectedEarningIds.length > 0) {
      break;
    }

    selectedEarningIds.push(earning.id);
    remaining -= earning.net_amount;
  }

  if (remaining > 0 || selectedEarningIds.length === 0) {
    throw new Error("NOT_ENOUGH_EARNINGS");
  }

  const { data: payoutRequest, error: payoutError } = await supabaseAdmin
    .from("payout_requests")
    .insert({
      creator_id: creatorId,
      amount: input.amount,
      currency,
      status: "pending",
    })
    .select()
    .single();

  if (payoutError || !payoutRequest) {
    throw payoutError ?? new Error("FAILED_TO_CREATE_PAYOUT_REQUEST");
  }

  const { data: updatedEarnings, error: updateError } = await supabaseAdmin
    .from("earnings")
    .update({
      status: "requested",
      payout_request_id: payoutRequest.id,
    })
    .in("id", selectedEarningIds)
    .eq("creator_id", creatorId)
    .is("payout_id", null)
    .is("payout_request_id", null)
    .eq("status", "available")
    .select("id");

  if (updateError) {
    await supabaseAdmin
      .from("payout_requests")
      .delete()
      .eq("id", payoutRequest.id);

    throw updateError;
  }

  if (!updatedEarnings || updatedEarnings.length !== selectedEarningIds.length) {
    await supabaseAdmin
      .from("payout_requests")
      .delete()
      .eq("id", payoutRequest.id);

    throw new Error("FAILED_TO_LOCK_EARNINGS_FOR_PAYOUT_REQUEST");
  }

  return payoutRequest;
}