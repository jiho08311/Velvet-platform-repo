import { supabaseAdmin } from "@/infrastructure/supabase/admin";
import { resolvePayoutExecutionPolicy } from "@/modules/payout/lib/payout-execution-policy";

/**
 * Canonical terminal execution authority for payout paid/failed transitions.
 *
 * Source-of-truth rules for this section:
 * - All payout terminal state writes must go through this file.
 * - All linked earnings terminal writes for payout execution must go through this file.
 * - Public payout-domain entry points (send / mark-as-failed) are thin intent adapters only.
 * - Admin server wrappers must never re-implement terminal execution business logic.
 *
 * This file owns:
 * - payout terminal precondition checks
 * - payout terminal writes
 * - linked earnings terminal writes
 * - rollback on partial failure
 * - terminal postcondition verification
 *
 * Non-goals for this file:
 * - payout request approve/reject flow
 * - request-phase earnings release helpers
 * - read-side summaries / list shaping
 */
type ExecutePayoutTerminalTransitionTarget = "paid" | "failed";

type ExecutePayoutTerminalTransitionParams = {
  payoutId: string;
  targetState: ExecutePayoutTerminalTransitionTarget;
  failureReason?: string;
};

type PayoutRow = {
  id: string;
  status: "pending" | "processing" | "paid" | "failed";
  paid_at: string | null;
  failure_reason: string | null;
};

type LinkedEarningRow = {
  id: string;
  status: "pending" | "available" | "requested" | "paid_out" | "reversed";
  payout_id: string | null;
  payout_request_id: string | null;
  paid_out_at: string | null;
};

function normalizePayoutId(payoutId: string): string {
  const safePayoutId = payoutId.trim();

  if (!safePayoutId) {
    throw new Error("Invalid payout id");
  }

  return safePayoutId;
}

async function getPayoutOrThrow(payoutId: string): Promise<PayoutRow> {
  const { data, error } = await supabaseAdmin
    .from("payouts")
    .select("id, status, paid_at, failure_reason")
    .eq("id", payoutId)
    .single<PayoutRow>();

  if (error || !data) {
    throw new Error("Payout not found");
  }

  return data;
}

async function getLinkedRequestedEarnings(
  payoutId: string
): Promise<LinkedEarningRow[]> {
  const { data, error } = await supabaseAdmin
    .from("earnings")
    .select("id, status, payout_id, payout_request_id, paid_out_at")
    .eq("payout_id", payoutId)
    .eq("status", "requested")
    .returns<LinkedEarningRow[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Canonical paid postcondition verification.
 * Paid terminal success is not complete unless:
 * - payout is paid
 * - every linked requested earning is paid_out
 * - every linked requested earning has paid_out_at
 */
async function verifyPaidPostcondition(params: {
  payoutId: string;
  earningIds: string[];
}): Promise<void> {
  const payout = await getPayoutOrThrow(params.payoutId);

  if (payout.status !== "paid") {
    throw new Error("PAYOUT_PAID_POSTCONDITION_FAILED");
  }

  if (params.earningIds.length === 0) {
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("earnings")
    .select("id, status, payout_id, payout_request_id, paid_out_at")
    .in("id", params.earningIds)
    .returns<LinkedEarningRow[]>();

  if (error) {
    throw error;
  }

  const rows = data ?? [];

  if (rows.length !== params.earningIds.length) {
    throw new Error("PAID_EARNINGS_POSTCONDITION_COUNT_MISMATCH");
  }

  const hasInvalidRow = rows.some((row) => {
    return (
      row.status !== "paid_out" ||
      row.payout_id !== params.payoutId ||
      !row.paid_out_at
    );
  });

  if (hasInvalidRow) {
    throw new Error("PAID_EARNINGS_POSTCONDITION_FAILED");
  }
}

/**
 * Canonical failed postcondition verification.
 * Failed terminal success is not complete unless:
 * - payout is failed
 * - every linked requested earning is released back to available
 * - released earnings no longer point at payout / payout_request
 */
async function verifyFailedPostcondition(params: {
  payoutId: string;
  releasedEarningIds: string[];
}): Promise<void> {
  const payout = await getPayoutOrThrow(params.payoutId);

  if (payout.status !== "failed") {
    throw new Error("PAYOUT_FAILED_POSTCONDITION_FAILED");
  }

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
    throw new Error("FAILED_EARNINGS_POSTCONDITION_COUNT_MISMATCH");
  }

  const hasInvalidRow = rows.some((row) => {
    return (
      row.status !== "available" ||
      row.payout_id !== null ||
      row.payout_request_id !== null
    );
  });

  if (hasInvalidRow) {
    throw new Error("FAILED_EARNINGS_POSTCONDITION_FAILED");
  }
}

export async function executePayoutTerminalTransition({
  payoutId,
  targetState,
  failureReason,
}: ExecutePayoutTerminalTransitionParams) {
  const safePayoutId = normalizePayoutId(payoutId);
  const payout = await getPayoutOrThrow(safePayoutId);
  const policy = resolvePayoutExecutionPolicy(payout);

  if (targetState === "paid" && !policy.canSend) {
    throw new Error("PAYOUT_NOT_SENDABLE");
  }

  if (targetState === "failed" && !policy.canMarkAsFailed) {
    throw new Error("PAYOUT_NOT_FAILABLE");
  }

  const linkedRequestedEarnings = await getLinkedRequestedEarnings(safePayoutId);
  const linkedRequestedEarningIds = linkedRequestedEarnings.map((row) => row.id);
  const now = new Date().toISOString();

  if (targetState === "paid") {
    const { data: updatedPayout, error: payoutUpdateError } = await supabaseAdmin
      .from("payouts")
      .update({
        status: "paid",
        paid_at: now,
        failure_reason: null,
      })
      .eq("id", safePayoutId)
      .select("id, status, paid_at, failure_reason")
      .single<PayoutRow>();

    if (payoutUpdateError || !updatedPayout) {
      throw payoutUpdateError ?? new Error("FAILED_TO_MARK_PAYOUT_AS_PAID");
    }

    if (linkedRequestedEarningIds.length > 0) {
      const { data: updatedEarnings, error: earningsUpdateError } =
        await supabaseAdmin
          .from("earnings")
          .update({
            status: "paid_out",
            paid_out_at: now,
          })
          .in("id", linkedRequestedEarningIds)
          .eq("status", "requested")
          .select("id")
          .returns<Array<{ id: string }>>();

      if (earningsUpdateError) {
        await supabaseAdmin
          .from("payouts")
          .update({
            status: payout.status,
            paid_at: payout.paid_at,
            failure_reason: payout.failure_reason,
          })
          .eq("id", safePayoutId);

        throw earningsUpdateError;
      }

      if (!updatedEarnings || updatedEarnings.length !== linkedRequestedEarningIds.length) {
        await supabaseAdmin
          .from("payouts")
          .update({
            status: payout.status,
            paid_at: payout.paid_at,
            failure_reason: payout.failure_reason,
          })
          .eq("id", safePayoutId);

        throw new Error("FAILED_TO_CLOSE_ALL_LINKED_EARNINGS_AS_PAID_OUT");
      }
    }

    await verifyPaidPostcondition({
      payoutId: safePayoutId,
      earningIds: linkedRequestedEarningIds,
    });

    return {
      payoutId: safePayoutId,
      targetState,
      linkedEarningIds: linkedRequestedEarningIds,
    };
  }

  const normalizedFailureReason =
    failureReason?.trim() || "Marked as failed by admin";

  const { data: updatedPayout, error: payoutUpdateError } = await supabaseAdmin
    .from("payouts")
    .update({
      status: "failed",
      failure_reason: normalizedFailureReason,
      paid_at: null,
    })
    .eq("id", safePayoutId)
    .select("id, status, paid_at, failure_reason")
    .single<PayoutRow>();

  if (payoutUpdateError || !updatedPayout) {
    throw payoutUpdateError ?? new Error("FAILED_TO_MARK_PAYOUT_AS_FAILED");
  }

  if (linkedRequestedEarningIds.length > 0) {
    const { data: releasedEarnings, error: releaseError } = await supabaseAdmin
      .from("earnings")
      .update({
        status: "available",
        payout_id: null,
        payout_request_id: null,
        paid_out_at: null,
      })
      .in("id", linkedRequestedEarningIds)
      .eq("status", "requested")
      .select("id")
      .returns<Array<{ id: string }>>();

      if (releaseError) {
        await supabaseAdmin
          .from("payouts")
          .update({
            status: payout.status,
            paid_at: payout.paid_at,
            failure_reason: payout.failure_reason,
          })
          .eq("id", safePayoutId);

        throw releaseError;
      }

      if (!releasedEarnings || releasedEarnings.length !== linkedRequestedEarningIds.length) {
        await supabaseAdmin
          .from("payouts")
          .update({
            status: payout.status,
            paid_at: payout.paid_at,
            failure_reason: payout.failure_reason,
          })
          .eq("id", safePayoutId);

        throw new Error("FAILED_TO_RELEASE_ALL_LINKED_EARNINGS");
      }
  }

  await verifyFailedPostcondition({
    payoutId: safePayoutId,
    releasedEarningIds: linkedRequestedEarningIds,
  });

  return {
    payoutId: safePayoutId,
    targetState,
    linkedEarningIds: linkedRequestedEarningIds,
  };
}