import { StatusBadge } from "@/shared/ui/StatusBadge"

type PaymentHistoryItem = {
  id: string
  amount: number
  status: "pending" | "paid" | "failed"
  createdAt: string
}

type PaymentHistoryListProps = {
  payments: PaymentHistoryItem[]
  emptyMessage?: string
}

export function PaymentHistoryList({
  payments,
  emptyMessage = "No payments yet.",
}: PaymentHistoryListProps) {
  if (payments.length === 0) {
    return (
      <section className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <ul className="divide-y divide-zinc-200">
        {payments.map((payment) => (
          <li
            key={payment.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-zinc-900">
                ₩{payment.amount.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-500">{payment.createdAt}</p>
            </div>

            <StatusBadge label={payment.status} />
          </li>
        ))}
      </ul>
    </section>
  )
}