import { SkeletonCard } from "@/shared/ui/SkeletonCard"
import { FEED_LOADING_STATE } from "./feed-surface-policy"

type FeedListSkeletonProps = {
  count?: number
}

export function FeedListSkeleton({
  count = FEED_LOADING_STATE.skeletonCount,
}: FeedListSkeletonProps) {
  return (
    <section className="flex w-full flex-col gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard
          key={index}
          lines={1}
          showAvatar
        />
      ))}
    </section>
  )
}