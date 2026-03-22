import { EmptyState } from "@/shared/ui/EmptyState"

type PayoutEmptyStateProps = {
  title?: string
  description?: string
}

export function PayoutEmptyState({
  title = "No payouts yet",
  description = "Your payout history will appear here.",
}: PayoutEmptyStateProps) {
  return (
    <div className="border border-zinc-200 bg-white p-4">
      <EmptyState title={title} description={description} />
    </div>
  )
}