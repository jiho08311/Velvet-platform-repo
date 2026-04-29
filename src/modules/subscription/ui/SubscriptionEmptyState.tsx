import { EmptyState } from "@/shared/ui/EmptyState"

type SubscriptionEmptyStateProps = {
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
}

export function SubscriptionEmptyState({
  title = "No subscriptions yet",
  description = "Subscribe to creators to see content here.",
  actionLabel,
  actionHref,
}: SubscriptionEmptyStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      actionLabel={actionLabel}
      actionHref={actionHref}
    />
  )
}