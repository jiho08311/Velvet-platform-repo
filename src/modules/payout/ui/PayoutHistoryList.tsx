import { EmptyState } from "@/shared/ui/EmptyState"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import type { PayoutExecutionLifecycleState } from "@/modules/payout/lib/resolve-payout-state"

type PayoutHistoryListItem = {
  id: string
  amount: number
  currency?: string | null
  lifecycleState: PayoutExecutionLifecycleState
  createdAt: string
  paidAt?: string | null
  failureReason?: string | null
}

type PayoutHistoryListProps = {
  payouts: PayoutHistoryListItem[]
  emptyTitle?: string
  emptyDescription?: string
}

function formatPrice(amount: number, currency = "KRW") {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function getPayoutExecutionLabel(
  lifecycleState: PayoutExecutionLifecycleState
): string {
  if (lifecycleState === "paid") {
    return "지급 완료"
  }

  if (lifecycleState === "failed") {
    return "지급 실패"
  }

  return "처리 중"
}

function renderPayoutMeta(payout: PayoutHistoryListItem) {
  return (
    <>
      <p className="text-sm font-medium text-zinc-900">
        생성됨 {formatDate(payout.createdAt)}
      </p>

      {payout.lifecycleState === "paid" && payout.paidAt ? (
        <p className="mt-1 text-xs text-zinc-500">
          지급됨 {formatDate(payout.paidAt)}
        </p>
      ) : null}

      {payout.lifecycleState === "failed" && payout.failureReason ? (
        <p className="mt-1 text-xs text-red-600">
          {payout.failureReason}
        </p>
      ) : null}
    </>
  )
}

export function PayoutHistoryList({
  payouts,
  emptyTitle = "출금 내역이 없습니다",
  emptyDescription = "출금 실행 내역은 생성되면 여기에 표시됩니다.",
}: PayoutHistoryListProps) {
  if (payouts.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
      <div className="hidden grid-cols-[1fr_auto_auto] gap-4 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 sm:grid">
        <span>출금</span>
        <span className="text-right">금액</span>
        <span className="text-right">상태</span>
      </div>

      <div className="divide-y divide-zinc-200">
        {payouts.map((payout) => (
          <div
            key={payout.id}
            className="grid gap-4 px-5 py-4 transition-all duration-200 ease-out hover:bg-zinc-50 sm:grid-cols-[1fr_auto_auto] sm:items-center"
          >
            <div className="min-w-0">{renderPayoutMeta(payout)}</div>

            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500 sm:hidden">
                금액
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 sm:mt-0">
                {formatPrice(payout.amount, payout.currency ?? "KRW")}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500 sm:hidden">
                상태
              </p>
              <div className="mt-1 sm:mt-0">
                <StatusBadge label={getPayoutExecutionLabel(payout.lifecycleState)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Backward-compatible alias.
 * Keep this export until all existing imports have been verified.
 */
export const PayoutList = PayoutHistoryList