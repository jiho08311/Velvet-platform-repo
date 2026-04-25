import { supabaseAdmin } from "@/infrastructure/supabase/admin";
import { resolvePayoutRequestLifecycleState } from "@/modules/payout/lib/resolve-payout-state";
import { createAuditLog } from "@/modules/analytics/server/create-audit-log"
type ApprovePayoutRequestParams = {
  payoutRequestId: string;
};

type ApprovePayoutRequestResultRow = {
  payout_request_id: string;
  payout_id: string;
  creator_id: string;
  amount: number;
  currency: string;
  status: string;
};

type PayoutRequestRow = {
  id: string;
  status: string;
  approved_at: string | null;
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
    .select("id, status, approved_at")
    .eq("id", payoutRequestId)
    .single<PayoutRequestRow>();

  if (error || !data) {
    throw new Error("PAYOUT_REQUEST_NOT_FOUND");
  }

  return data;
}

async function verifyApprovedPostcondition(params: {
  payoutRequestId: string;
}): Promise<void> {
  const payoutRequest = await getPayoutRequestOrThrow(params.payoutRequestId);

  if (payoutRequest.status !== "approved") {
    throw new Error("PAYOUT_REQUEST_NOT_APPROVED");
  }

  if (!payoutRequest.approved_at) {
    throw new Error("PAYOUT_REQUEST_APPROVED_AT_MISSING");
  }
}

export async function approvePayoutRequest({
  payoutRequestId,
}: ApprovePayoutRequestParams): Promise<void> {
  const safePayoutRequestId = normalizePayoutRequestId(payoutRequestId);
  const payoutRequest = await getPayoutRequestOrThrow(safePayoutRequestId);

  const lifecycle = resolvePayoutRequestLifecycleState({
    payoutRequestStatus: payoutRequest.status,
  });

  if (lifecycle.state !== "pending_request") {
    throw new Error("PAYOUT_REQUEST_NOT_APPROVABLE");
  }

  const { data, error } = await supabaseAdmin.rpc(
    "approve_payout_request_and_create_payout",
    {
      p_payout_request_id: safePayoutRequestId,
    }
  );

  if (error) {
    throw error;
  }

 const rows = (data ?? []) as ApprovePayoutRequestResultRow[];

if (rows.length === 0) {
  throw new Error("FAILED_TO_APPROVE_PAYOUT_REQUEST");
}

const approvedRow = rows[0];

await verifyApprovedPostcondition({
  payoutRequestId: safePayoutRequestId,
});

await createAuditLog({
  actorId: null,
  action: "payout_approved",
  targetType: "payout_request",
  targetId: safePayoutRequestId,
  metadata: {
    payoutId: approvedRow.payout_id,
    creatorId: approvedRow.creator_id,
    amount: approvedRow.amount,
    currency: approvedRow.currency,
  },
});
}