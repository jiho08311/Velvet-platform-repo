import { SkeletonCard } from "@/shared/ui/SkeletonCard"

type FeedListSkeletonProps = {
  count?: number
}

export function FeedListSkeleton({
  count = 4,
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