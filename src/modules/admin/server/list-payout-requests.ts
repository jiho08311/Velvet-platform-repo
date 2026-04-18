import { createClient } from "@/infrastructure/supabase/server";
import {
  resolvePayoutExecutionLifecycleState,
  resolvePayoutRequestLifecycleState,
  type PayoutExecutionLifecycleState,
  type PayoutRequestLifecycleState,
} from "@/modules/payout/lib/resolve-payout-state";

export type AdminPayoutAction =
  | "approve"
  | "reject"
  | "mark_as_paid"
  | "mark_as_failed";

export type AdminPayoutBadgeTone =
  | "pending"
  | "approved"
  | "rejected"
  | "processing"
  | "paid"
  | "failed";

export type AdminPayoutStatusBadge = {
  key: "request" | "payout";
  label: string;
  tone: AdminPayoutBadgeTone;
};

export type AdminPayoutActionAvailability = {
  approve: boolean;
  reject: boolean;
  markAsPaid: boolean;
  markAsFailed: boolean;
};

export type AdminPayoutRequestListItem = {
  id: string;
  creator_id: string;
  creator_username: string | null;
  creator_display_name: string | null;
  creator_label: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  payout_id: string | null;
  payout_status: "pending" | "processing" | "paid" | "failed" | null;
  payout_paid_at: string | null;
  payout_failure_reason: string | null;
  request_lifecycle_state: PayoutRequestLifecycleState;
  payout_execution_state: PayoutExecutionLifecycleState | null;
  status_badges: AdminPayoutStatusBadge[];
  available_actions: AdminPayoutActionAvailability;
  available_action_order: AdminPayoutAction[];
  failure_message: string | null;
};

type CreatorProfileRow = {
  username: string | null;
  display_name: string | null;
};

type CreatorRow = {
  username: string | null;
  display_name: string | null;
};

type PayoutRow = {
  id: string;
  status: "pending" | "processing" | "paid" | "failed";
  paid_at: string | null;
  failure_reason: string | null;
};

type PayoutRequestRow = {
  id: string;
  creator_id: string;
  amount: number | null;
  currency: string | null;
  status: string;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  payouts?: PayoutRow[] | PayoutRow | null;
  creators?:
    | {
        username: string | null;
        display_name?: string | null;
        profiles?: CreatorProfileRow[] | CreatorProfileRow | null;
      }
    | Array<{
        username: string | null;
        display_name?: string | null;
        profiles?: CreatorProfileRow[] | CreatorProfileRow | null;
      }>
    | null;
};

function toCreatorRow(
  value:
    | PayoutRequestRow["creators"]
    | undefined
): CreatorRow | null {
  const creator = Array.isArray(value) ? value[0] ?? null : value ?? null;

  if (!creator) {
    return null;
  }

  const profile = Array.isArray(creator.profiles)
    ? creator.profiles[0] ?? null
    : creator.profiles ?? null;

  return {
    username: creator.username ?? profile?.username ?? null,
    display_name: creator.display_name ?? profile?.display_name ?? null,
  };
}

function resolveCreatorLabel(input: {
  creatorId: string;
  creatorUsername: string | null;
  creatorDisplayName: string | null;
}): string {
  const username = input.creatorUsername?.trim() || null;
  const displayName = input.creatorDisplayName?.trim() || null;

  if (displayName && username) {
    return `${displayName} (@${username})`;
  }

  if (displayName) {
    return displayName;
  }

  if (username) {
    return `@${username}`;
  }

  return input.creatorId;
}

function resolveRequestBadge(
  requestLifecycleState: PayoutRequestLifecycleState
): AdminPayoutStatusBadge {
  if (requestLifecycleState === "pending_request") {
    return {
      key: "request",
      label: "request: Pending",
      tone: "pending",
    };
  }

  if (requestLifecycleState === "approved") {
    return {
      key: "request",
      label: "request: Approved",
      tone: "approved",
    };
  }

  if (requestLifecycleState === "rejected") {
    return {
      key: "request",
      label: "request: Rejected",
      tone: "rejected",
    };
  }

  return {
    key: "request",
    label: "request: Inactive",
    tone: "pending",
  };
}

function resolvePayoutBadge(
  payoutExecutionState: PayoutExecutionLifecycleState | null
): AdminPayoutStatusBadge | null {
  if (!payoutExecutionState) {
    return null;
  }

  if (payoutExecutionState === "paid") {
    return {
      key: "payout",
      label: "payout: Paid",
      tone: "paid",
    };
  }

  if (payoutExecutionState === "failed") {
    return {
      key: "payout",
      label: "payout: Failed",
      tone: "failed",
    };
  }

  return {
    key: "payout",
    label: "payout: Processing",
    tone: "processing",
  };
}

function resolveAvailableActions(input: {
  requestLifecycleState: PayoutRequestLifecycleState;
  payoutExecutionState: PayoutExecutionLifecycleState | null;
}): AdminPayoutActionAvailability {
  const { requestLifecycleState, payoutExecutionState } = input;

  if (requestLifecycleState === "pending_request") {
    return {
      approve: true,
      reject: true,
      markAsPaid: false,
      markAsFailed: false,
    };
  }

  if (requestLifecycleState === "rejected") {
    return {
      approve: false,
      reject: false,
      markAsPaid: false,
      markAsFailed: false,
    };
  }

  if (requestLifecycleState === "approved") {
    if (!payoutExecutionState || payoutExecutionState === "processing") {
      return {
        approve: false,
        reject: false,
        markAsPaid: true,
        markAsFailed: true,
      };
    }

    return {
      approve: false,
      reject: false,
      markAsPaid: false,
      markAsFailed: false,
    };
  }

  return {
    approve: false,
    reject: false,
    markAsPaid: false,
    markAsFailed: false,
  };
}

function toAvailableActionOrder(
  actions: AdminPayoutActionAvailability
): AdminPayoutAction[] {
  const ordered: AdminPayoutAction[] = [];

  if (actions.approve) {
    ordered.push("approve");
  }

  if (actions.reject) {
    ordered.push("reject");
  }

  if (actions.markAsPaid) {
    ordered.push("mark_as_paid");
  }

  if (actions.markAsFailed) {
    ordered.push("mark_as_failed");
  }

  return ordered;
}

export async function listPayoutRequests(): Promise<AdminPayoutRequestListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payout_requests")
    .select(`
      id,
      creator_id,
      amount,
      currency,
      status,
      created_at,
      approved_at,
      rejected_at,
      payouts (
        id,
        status,
        paid_at,
        failure_reason
      ),
      creators (
        username,
        profiles (
          username,
          display_name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items: AdminPayoutRequestListItem[] = (data ?? []).map(
    (item: PayoutRequestRow) => {
      const payout = Array.isArray(item.payouts)
        ? item.payouts[0] ?? null
        : item.payouts ?? null;

      const creator = toCreatorRow(item.creators);
      const creatorUsername = creator?.username ?? null;
      const creatorDisplayName = creator?.display_name ?? null;

      const requestLifecycleState = resolvePayoutRequestLifecycleState({
        payoutRequestStatus: item.status,
      }).state;

      const payoutExecutionState = payout
        ? resolvePayoutExecutionLifecycleState({
            payoutStatus: payout.status,
          })
        : null;

      const requestBadge = resolveRequestBadge(requestLifecycleState);
      const payoutBadge = resolvePayoutBadge(payoutExecutionState);
      const availableActions = resolveAvailableActions({
        requestLifecycleState,
        payoutExecutionState,
      });

      return {
        id: item.id,
        creator_id: item.creator_id,
        creator_username: creatorUsername,
        creator_display_name: creatorDisplayName,
        creator_label: resolveCreatorLabel({
          creatorId: item.creator_id,
          creatorUsername,
          creatorDisplayName,
        }),
        amount: Number(item.amount ?? 0),
        currency: item.currency ?? "KRW",
        status: item.status,
        created_at: item.created_at,
        approved_at: item.approved_at ?? null,
        rejected_at: item.rejected_at ?? null,
        payout_id: payout?.id ?? null,
        payout_status: payout?.status ?? null,
        payout_paid_at: payout?.paid_at ?? null,
        payout_failure_reason: payout?.failure_reason ?? null,
        request_lifecycle_state: requestLifecycleState,
        payout_execution_state: payoutExecutionState,
        status_badges: payoutBadge ? [requestBadge, payoutBadge] : [requestBadge],
        available_actions: availableActions,
        available_action_order: toAvailableActionOrder(availableActions),
        failure_message:
          payoutExecutionState === "failed"
            ? payout?.failure_reason ?? "Payout failed"
            : null,
      };
    }
  );

  return items.sort((a, b) => {
    const aPending = a.request_lifecycle_state === "pending_request" ? 0 : 1;
    const bPending = b.request_lifecycle_state === "pending_request" ? 0 : 1;

    if (aPending !== bPending) {
      return aPending - bPending;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}