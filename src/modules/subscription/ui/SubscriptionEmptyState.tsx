import { EmptyState } from "@/shared/ui/EmptyState"

type SubscriptionEmptyStateProps = {
  title?: string
  description?: string
}

export function SubscriptionEmptyState({
  title = "No subscriptions yet",
  description = "Subscribe to creators to see content here.",
}: SubscriptionEmptyStateProps) {
  return <EmptyState title={title} description={description} />
}