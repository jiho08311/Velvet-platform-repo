import { supabaseAdmin } from "@/infrastructure/supabase/admin";
import { resolvePayoutRequestLifecycleState } from "@/modules/payout/lib/resolve-payout-state";
import { releasePayoutRequestEarnings } from "./release-payout-request-earnings";

/**
 * Canonical request-phase rejection flow.
 *
 * This file owns payout request rejection only.
 * It is NOT part of canonical payout terminal paid/failed execution authority.
 *
 * Separation of concerns:
 * - request-phase reject authority: this file
 * - terminal payout paid/failed authority: execute-payout-terminal-transition.ts
 */
type RejectPayoutRequestParams = {
  payoutRequestId: string;
};

type PayoutRequestRow = {
  id: string;
  status: string;
  rejected_at: string | null;
};

function normalizePayoutRequestId(payoutRequestId: string): string {
  const safePayoutRequestId = payoutRequestId.trim();

  if (!safePayoutRequestId) {
    throw new Error("Invalid payout request id");
  }

  return safePayoutRequestId;
}

async function getPayoutRequestOrThrow(
  payoutRequestId: string
): Promise<PayoutRequestRow> {
  const { data, error } = await supabaseAdmin
    .from("payout_requests")
    .select("id, status, rejected_at")
    .eq("id", payoutRequestId)
    .single<PayoutRequestRow>();

  if (error || !data) {
    throw new Error("PAYOUT_REQUEST_NOT_FOUND");
  }

  return data;
}

async function verifyRejectedPostcondition(params: {
  payoutRequestId: string;
}): Promise<void> {
  const payoutRequest = await getPayoutRequestOrThrow(params.payoutRequestId);

  if (payoutRequest.status !== "rejected") {
    throw new Error("PAYOUT_REQUEST_REJECT_POSTCONDITION_FAILED");
  }

  if (!payoutRequest.rejected_at) {
    throw new Error("PAYOUT_REQUEST_REJECTED_AT_MISSING");
  }
}

export async function rejectPayoutRequest({
  payoutRequestId,
}: RejectPayoutRequestParams): Promise<void> {
  const safePayoutRequestId = normalizePayoutRequestId(payoutRequestId);
  const payoutRequest = await getPayoutRequestOrThrow(safePayoutRequestId);

  const lifecycle = resolvePayoutRequestLifecycleState({
    payoutRequestStatus: payoutRequest.status,
  });

  if (lifecycle.state !== "pending_request") {
    throw new Error("PAYOUT_REQUEST_NOT_REJECTABLE");
  }

  const rejectedAt = new Date().toISOString();

  const { data: rejectedRequest, error: rejectError } = await supabaseAdmin
    .from("payout_requests")
    .update({
      status: "rejected",
      rejected_at: rejectedAt,
    })
    .eq("id", safePayoutRequestId)
    .eq("status", "pending")
    .select("id, status, rejected_at")
    .single<PayoutRequestRow>();

  if (rejectError || !rejectedRequest) {
    throw rejectError ?? new Error("FAILED_TO_REJECT_PAYOUT_REQUEST");
  }

  try {
    await releasePayoutRequestEarnings({
      payoutRequestId: safePayoutRequestId,
    });
  } catch (error) {
    await supabaseAdmin
      .from("payout_requests")
      .update({
        status: payoutRequest.status,
        rejected_at: payoutRequest.rejected_at,
      })
      .eq("id", safePayoutRequestId);

    throw error;
  }

  await verifyRejectedPostcondition({
    payoutRequestId: safePayoutRequestId,
  });
}