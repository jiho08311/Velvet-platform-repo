import { EmptyState } from "@/shared/ui/EmptyState"

type PaymentEmptyStateProps = {
  title?: string
  description?: string
}

export function PaymentEmptyState({
  title = "No payments yet",
  description = "Your payment history will appear here.",
}: PaymentEmptyStateProps) {
  return (
    <div className="border border-zinc-200 bg-white p-4">
      <EmptyState title={title} description={description} />
    </div>
  )
}