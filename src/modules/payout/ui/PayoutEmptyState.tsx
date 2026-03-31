type PayoutEmptyStateProps = {
  title?: string
  description?: string
}

export function PayoutEmptyState({
  title = "No payouts yet",
  description = "Your payout history will appear here.",
}: PayoutEmptyStateProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-6 py-4">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          <span>Payout</span>
          <span>Amount</span>
          <span>Status</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 h-12 w-12 rounded-2xl bg-zinc-100" />
        <p className="text-lg font-semibold text-zinc-900">{title}</p>
        <p className="mt-2 text-sm text-zinc-500">{description}</p>
      </div>
    </div>
  )
}