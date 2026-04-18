import { AdminPayoutRequestListItem } from "../server/list-payout-requests";

import { PayoutMarkAsFailedButton } from "../ui/PayoutMarkAsFailedButton";
import { PayoutMarkAsPaidButton } from "../ui/PayoutMarkAsPaidButton";
import { PayoutRequestApproveButton } from "../ui/PayoutRequestApproveButton";
import { PayoutRequestRejectButton } from "../ui/PayoutRequestRejectButton";

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

function getCreatorLabel(item: AdminPayoutRequestListItem) {
  if (item.creator_display_name && item.creator_username) {
    return `${item.creator_display_name} (@${item.creator_username})`;
  }

  if (item.creator_display_name) {
    return item.creator_display_name;
  }

  if (item.creator_username) {
    return `@${item.creator_username}`;
  }

  return item.creator_id;
}

function getExecutionLabel(item: AdminPayoutRequestListItem) {
  if (!item.payout_status) {
    return null;
  }

  if (item.payout_status === "paid") {
    return "Paid";
  }

  if (item.payout_status === "failed") {
    return "Failed";
  }

  return "Processing";
}

function renderAction(item: AdminPayoutRequestListItem) {
  if (item.status === "pending") {
    return (
      <div className="flex flex-wrap gap-2">
        <PayoutRequestApproveButton payoutRequestId={item.id} disabled={false} />
        <PayoutRequestRejectButton payoutRequestId={item.id} disabled={false} />
      </div>
    );
  }

  if (item.status === "approved") {
    if (item.payout_status === "paid") {
      return (
        <span className="inline-flex rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400">
          Paid
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        <PayoutMarkAsPaidButton payoutRequestId={item.id} disabled={false} />
        <PayoutMarkAsFailedButton payoutRequestId={item.id} disabled={false} />
      </div>
    );
  }

  if (item.status === "rejected") {
    return (
      <span className="inline-flex rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-400">
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-400">
      {item.status}
    </span>
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
              <p className="truncate font-medium">{getCreatorLabel(item)}</p>
              <p className="mt-1 truncate text-xs text-zinc-400">{item.id}</p>
            </div>

            <div className="font-medium">
              {formatAmount(item.amount, item.currency)}
            </div>

            <div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                  request: {item.status}
                </span>

                {getExecutionLabel(item) ? (
                  <span className="inline-flex rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                    payout: {getExecutionLabel(item)}
                  </span>
                ) : null}
              </div>

              {item.payout_status === "failed" && item.payout_failure_reason ? (
                <p className="mt-2 text-xs text-red-400">{item.payout_failure_reason}</p>
              ) : null}
            </div>

            <div className="text-zinc-300">{formatDate(item.created_at)}</div>

            <div>{renderAction(item)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}