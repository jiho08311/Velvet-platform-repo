import { SkeletonCard } from "@/shared/ui/SkeletonCard"

type FeedListSkeletonProps = {
  count?: number
}

export function FeedListSkeleton({
  count = 4,
}: FeedListSkeletonProps) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard
          key={index}
          lines={index % 2 === 0 ? 3 : 2}
          showAvatar
          showMedia
        />
      ))}
    </section>
  )
}