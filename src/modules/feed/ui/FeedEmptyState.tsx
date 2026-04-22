import { EmptyState } from "@/shared/ui/EmptyState"
import { FEED_EMPTY_STATE } from "./feed-surface-policy"

type FeedEmptyStateProps = {
  title?: string
  description?: string
}

export function FeedEmptyState({
  title = FEED_EMPTY_STATE.defaultTitle,
  description = FEED_EMPTY_STATE.defaultDescription,
}: FeedEmptyStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      actionLabel={FEED_EMPTY_STATE.actionLabel}
      actionHref={FEED_EMPTY_STATE.actionHref}
    />
  )
}