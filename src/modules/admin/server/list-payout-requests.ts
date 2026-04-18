import { createClient } from "@/infrastructure/supabase/server";
import {
  resolvePayoutExecutionLifecycleState,
  resolvePayoutRequestLifecycleState,
  type PayoutExecutionLifecycleState,
  type PayoutRequestLifecycleState,
} from "@/modules/payout/lib/resolve-payout-state";

import {
  resolveAdminPayoutRequestRow,
  type AdminPayoutAction,
} from "@/modules/admin/lib/payout-request-admin-policy";

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
  available_action_order: AdminPayoutAction[];
  failure_message: string | null;
};

type CreatorProfileJoinRow = {
  username: string | null;
  display_name: string | null;
};

type CreatorJoinRow = {
  username: string | null;
  display_name: string | null;
  profiles?: CreatorProfileJoinRow[] | CreatorProfileJoinRow | null;
};

type ResolvedCreatorPresentation = {
  username: string | null;
  displayName: string | null;
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
  creators?: CreatorJoinRow[] | CreatorJoinRow | null;
};

function takeFirst<T>(value: T[] | T | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeCreatorPresentation(
  value: PayoutRequestRow["creators"]
): ResolvedCreatorPresentation {
  const creator = takeFirst(value);
  const profile = takeFirst(creator?.profiles);

  return {
    username: creator?.username?.trim() || profile?.username?.trim() || null,
    displayName:
      creator?.display_name?.trim() ||
      profile?.display_name?.trim() ||
      null,
  };
}

function resolveCreatorLabel(input: {
  creatorId: string;
  creatorUsername: string | null;
  creatorDisplayName: string | null;
}): string {
  if (input.creatorDisplayName && input.creatorUsername) {
    return `${input.creatorDisplayName} (@${input.creatorUsername})`;
  }
  if (input.creatorDisplayName) return input.creatorDisplayName;
  if (input.creatorUsername) return `@${input.creatorUsername}`;
  return input.creatorId;
}

export async function listPayoutRequests(): Promise<
  AdminPayoutRequestListItem[]
> {
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
        display_name,
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
      const payout = takeFirst(item.payouts);
      const creatorPresentation = normalizeCreatorPresentation(item.creators);

      const requestLifecycleState = resolvePayoutRequestLifecycleState({
        payoutRequestStatus: item.status,
      }).state;

      const payoutExecutionState = payout
        ? resolvePayoutExecutionLifecycleState({
            payoutStatus: payout.status,
          })
        : null;

      // 🔥 핵심 변경
      const policy = resolveAdminPayoutRequestRow({
        requestLifecycleState,
        payoutExecutionState,
        hasPayout: Boolean(payout),
      });

      const failureMessage =
        payoutExecutionState === "failed"
          ? payout?.failure_reason ?? "Payout failed"
          : null;

      const creatorLabel = resolveCreatorLabel({
        creatorId: item.creator_id,
        creatorUsername: creatorPresentation.username,
        creatorDisplayName: creatorPresentation.displayName,
      });

      return {
        id: item.id,
        creator_id: item.creator_id,
        creator_username: creatorPresentation.username,
        creator_display_name: creatorPresentation.displayName,
        creator_label: creatorLabel,
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
        status_badges: policy.badges,
        available_action_order: policy.actions,
        failure_message: failureMessage,
      };
    }
  );

  return items.sort((a, b) => {
    const aPending = a.request_lifecycle_state === "pending_request" ? 0 : 1;
    const bPending = b.request_lifecycle_state === "pending_request" ? 0 : 1;

    if (aPending !== bPending) return aPending - bPending;

    return (
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    );
  });
}