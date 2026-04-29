import type { CreatorPaymentHistoryItem } from "@/modules/payment/types"
import { StatusBadge } from "@/shared/ui/StatusBadge"

type PaymentHistoryListProps = {
  payments: CreatorPaymentHistoryItem[]
  emptyMessage?: string
}

type PaymentHistoryListItemProps = {
  payment: CreatorPaymentHistoryItem
}

const emptyStateClassName =
  "rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center"

const emptyStateTextClassName = "text-sm text-zinc-500"

const listSectionClassName =
  "overflow-hidden rounded-md border border-zinc-200 bg-white"

const listClassName = "divide-y divide-zinc-200"

const listItemClassName =
  "flex items-center justify-between px-4 py-3"

const amountClassName = "text-sm font-medium text-zinc-900"

const dateClassName = "text-xs text-zinc-500"

function PaymentHistoryListItem({
  payment,
}: PaymentHistoryListItemProps) {
  return (
    <li className={listItemClassName}>
      <div>
        <p className={amountClassName}>{payment.displayAmount}</p>
        <p className={dateClassName}>{payment.displayDate}</p>
      </div>

      <StatusBadge label={payment.statusLabel} />
    </li>
  )
}

export function PaymentHistoryList({
  payments,
  emptyMessage = "No payments yet.",
}: PaymentHistoryListProps) {
  if (payments.length === 0) {
    return (
      <section className={emptyStateClassName}>
        <p className={emptyStateTextClassName}>{emptyMessage}</p>
      </section>
    )
  }

  return (
    <section className={listSectionClassName}>
      <ul className={listClassName}>
        {payments.map((payment) => (
          <PaymentHistoryListItem key={payment.id} payment={payment} />
        ))}
      </ul>
    </section>
  )
}