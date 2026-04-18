import type { AdminPayoutAction } from "@/modules/admin/lib/payout-request-admin-policy";
import type { AdminPayoutRequestListItem } from "@/modules/admin/server/list-payout-requests";

import { AdminBadge } from "./AdminBadge";
import { PayoutMarkAsFailedButton } from "./PayoutMarkAsFailedButton";
import { PayoutMarkAsPaidButton } from "./PayoutMarkAsPaidButton";
import { PayoutRequestApproveButton } from "./PayoutRequestApproveButton";
import { PayoutRequestRejectButton } from "./PayoutRequestRejectButton";

type PayoutRequestAdminListProps = {
  items: AdminPayoutRequestListItem[];
};

type ResolvedAdminPayoutRow = Pick<
  AdminPayoutRequestListItem,
  | "id"
  | "creator_label"
  | "amount"
  | "currency"
  | "created_at"
  | "status_badges"
  | "available_action_order"
  | "failure_message"
>;

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: currency || "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type ActionRenderer = (payoutRequestId: string) => React.ReactNode;

const actionRenderers: Record<AdminPayoutAction, ActionRenderer> = {
  approve: (payoutRequestId) => (
    <PayoutRequestApproveButton
      key={`${payoutRequestId}-approve`}
      payoutRequestId={payoutRequestId}
      disabled={false}
    />
  ),
  reject: (payoutRequestId) => (
    <PayoutRequestRejectButton
      key={`${payoutRequestId}-reject`}
      payoutRequestId={payoutRequestId}
      disabled={false}
    />
  ),
  mark_as_paid: (payoutRequestId) => (
    <PayoutMarkAsPaidButton
      key={`${payoutRequestId}-mark-as-paid`}
      payoutRequestId={payoutRequestId}
      disabled={false}
    />
  ),
  mark_as_failed: (payoutRequestId) => (
    <PayoutMarkAsFailedButton
      key={`${payoutRequestId}-mark-as-failed`}
      payoutRequestId={payoutRequestId}
      disabled={false}
    />
  ),
};

function renderActions(actions: AdminPayoutAction[], payoutRequestId: string) {
  if (actions.length === 0) {
    return (
      <span className="inline-flex rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-400">
        No actions
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => actionRenderers[action](payoutRequestId))}
    </div>
  );
}

function renderFailureMessage(message: string | null) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-xs text-red-400">{message}</p>;
}

function PayoutRequestAdminRow({ row }: { row: ResolvedAdminPayoutRow }) {
  return (
    <div className="grid grid-cols-5 gap-4 px-5 py-4 text-sm text-white">
      <div className="min-w-0">
        <p className="truncate font-medium">{row.creator_label}</p>
        <p className="mt-1 truncate text-xs text-zinc-400">{row.id}</p>
      </div>

      <div className="font-medium">{formatAmount(row.amount, row.currency)}</div>

      <div>
        <div className="flex flex-wrap gap-2">
          {row.status_badges.map((badge) => (
            <AdminBadge
              key={`${row.id}-${badge.key}-${badge.label}`}
              label={badge.label}
              tone={badge.tone}
            />
          ))}
        </div>

        {renderFailureMessage(row.failure_message)}
      </div>

      <div className="text-zinc-300">{formatDate(row.created_at)}</div>

      <div>{renderActions(row.available_action_order, row.id)}</div>
    </div>
  );
}

export function PayoutRequestAdminList({
  items,
}: PayoutRequestAdminListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 text-sm text-zinc-400">
        요청된 payout request가 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
      <div className="grid grid-cols-5 gap-4 border-b border-zinc-800 px-5 py-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
        <div>Creator</div>
        <div>Amount</div>
        <div>Status</div>
        <div>Created At</div>
        <div>Action</div>
      </div>

      <div className="divide-y divide-zinc-800">
        {items.map((item) => (
          <PayoutRequestAdminRow
            key={item.id}
            row={{
              id: item.id,
              creator_label: item.creator_label,
              amount: item.amount,
              currency: item.currency,
              created_at: item.created_at,
              status_badges: item.status_badges,
              available_action_order: item.available_action_order,
              failure_message: item.failure_message,
            }}
          />
        ))}
      </div>
    </div>
  );
}