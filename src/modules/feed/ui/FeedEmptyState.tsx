import { EmptyState } from "@/shared/ui/EmptyState"

type FeedEmptyStateProps = {
  title?: string
  description?: string
}

export function FeedEmptyState({
  title = "No feed yet",
  description = "Subscribe to creators to see posts in your feed.",
}: FeedEmptyStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      actionLabel="Explore creators"
      actionHref="/search"
    />
  )
}