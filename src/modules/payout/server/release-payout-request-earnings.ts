import { supabaseAdmin } from "@/infrastructure/supabase/admin";

/**
 * Request-phase helper only.
 *
 * This file is the earnings release helper for payout request rejection flow.
 * It is NOT the canonical failed terminal payout authority.
 *
 * Canonical failed terminal payout authority lives in:
 * - execute-payout-terminal-transition.ts
 *
 * Use this helper only when rejecting a payout request before terminal payout execution.
 * Do not reuse this helper as the source of truth for payout failed terminal behavior.
 */
type LinkedEarningRow = {
  id: string;
  status: "pending" | "available" | "requested" | "paid_out" | "reversed";
  payout_id: string | null;
  payout_request_id: string | null;
  paid_out_at: string | null;
};

type ReleasePayoutRequestEarningsParams = {
  payoutRequestId: string;
};

function normalizePayoutRequestId(payoutRequestId: string): string {
  const safePayoutRequestId = payoutRequestId.trim();

  if (!safePayoutRequestId) {
    throw new Error("Invalid payout request id");
  }

  return safePayoutRequestId;
}

async function getLinkedRequestedEarnings(
  payoutRequestId: string
): Promise<LinkedEarningRow[]> {
  const { data, error } = await supabaseAdmin
    .from("earnings")
    .select("id, status, payout_id, payout_request_id, paid_out_at")
    .eq("payout_request_id", payoutRequestId)
    .eq("status", "requested")
    .returns<LinkedEarningRow[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function verifyReleasedPostcondition(params: {
  releasedEarningIds: string[];
}): Promise<void> {
  if (params.releasedEarningIds.length === 0) {
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("earnings")
    .select("id, status, payout_id, payout_request_id, paid_out_at")
    .in("id", params.releasedEarningIds)
    .returns<LinkedEarningRow[]>();

  if (error) {
    throw error;
  }

  const rows = data ?? [];

  if (rows.length !== params.releasedEarningIds.length) {
    throw new Error("RELEASE_PAYOUT_REQUEST_EARNINGS_COUNT_MISMATCH");
  }

  const hasInvalidRow = rows.some((row) => {
    return (
      row.status !== "available" ||
      row.payout_request_id !== null ||
      row.payout_id !== null
    );
  });

  if (hasInvalidRow) {
    throw new Error("RELEASE_PAYOUT_REQUEST_EARNINGS_POSTCONDITION_FAILED");
  }
}

export async function releasePayoutRequestEarnings({
  payoutRequestId,
}: ReleasePayoutRequestEarningsParams): Promise<string[]> {
  const safePayoutRequestId = normalizePayoutRequestId(payoutRequestId);
  const linkedRequestedEarnings = await getLinkedRequestedEarnings(
    safePayoutRequestId
  );
  const linkedRequestedEarningIds = linkedRequestedEarnings.map(
    (earning) => earning.id
  );

  if (linkedRequestedEarningIds.length === 0) {
    return [];
  }

  const { data: releasedEarnings, error: releaseError } = await supabaseAdmin
    .from("earnings")
    .update({
      status: "available",
      payout_request_id: null,
      payout_id: null,
      paid_out_at: null,
    })
    .in("id", linkedRequestedEarningIds)
    .eq("status", "requested")
    .eq("payout_request_id", safePayoutRequestId)
    .select("id")
    .returns<Array<{ id: string }>>();

  if (releaseError) {
    throw releaseError;
  }

  if (
    !releasedEarnings ||
    releasedEarnings.length !== linkedRequestedEarningIds.length
  ) {
    throw new Error("FAILED_TO_RELEASE_ALL_LINKED_EARNINGS");
  }

  await verifyReleasedPostcondition({
    releasedEarningIds: linkedRequestedEarningIds,
  });

  return linkedRequestedEarningIds;
}