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
    <div className="border border-zinc-200 bg-white p-4">
      <EmptyState title={title} description={description} />
    </div>
  )
}