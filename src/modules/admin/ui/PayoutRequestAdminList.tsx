import { AdminPayoutRequestListItem } from "../server/list-payout-requests";
import { AdminBadge } from "./AdminBadge";
import { PayoutMarkAsFailedButton } from "./PayoutMarkAsFailedButton";
import { PayoutMarkAsPaidButton } from "./PayoutMarkAsPaidButton";
import { PayoutRequestApproveButton } from "./PayoutRequestApproveButton";
import { PayoutRequestRejectButton } from "./PayoutRequestRejectButton";

type PayoutRequestAdminListProps = {
  items: AdminPayoutRequestListItem[];
};

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

function renderActions(item: AdminPayoutRequestListItem) {
  const { available_actions: actions } = item;

  if (
    !actions.approve &&
    !actions.reject &&
    !actions.markAsPaid &&
    !actions.markAsFailed
  ) {
    return (
      <span className="inline-flex rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-400">
        No actions
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.approve ? (
        <PayoutRequestApproveButton payoutRequestId={item.id} disabled={false} />
      ) : null}

      {actions.reject ? (
        <PayoutRequestRejectButton payoutRequestId={item.id} disabled={false} />
      ) : null}

      {actions.markAsPaid ? (
        <PayoutMarkAsPaidButton payoutRequestId={item.id} disabled={false} />
      ) : null}

      {actions.markAsFailed ? (
        <PayoutMarkAsFailedButton payoutRequestId={item.id} disabled={false} />
      ) : null}
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
          <div
            key={item.id}
            className="grid grid-cols-5 gap-4 px-5 py-4 text-sm text-white"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{item.creator_label}</p>
              <p className="mt-1 truncate text-xs text-zinc-400">{item.id}</p>
            </div>

            <div className="font-medium">
              {formatAmount(item.amount, item.currency)}
            </div>

            <div>
              <div className="flex flex-wrap gap-2">
                {item.status_badges.map((badge) => (
                  <AdminBadge
                    key={`${item.id}-${badge.key}-${badge.label}`}
                    label={badge.label}
                    tone={badge.tone}
                  />
                ))}
              </div>

              {item.failure_message ? (
                <p className="mt-2 text-xs text-red-400">{item.failure_message}</p>
              ) : null}
            </div>

            <div className="text-zinc-300">{formatDate(item.created_at)}</div>

            <div>{renderActions(item)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}