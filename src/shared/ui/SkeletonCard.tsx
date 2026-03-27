import { Skeleton } from "./Skeleton"

type SkeletonCardProps = {
  lines?: number
  showAvatar?: boolean
  showMedia?: boolean
  className?: string
}

export function SkeletonCard({
  lines = 2,
  showAvatar = true,
  showMedia = false,
  className = "",
}: SkeletonCardProps) {
  return (
    <div
      className={`rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 ${className}`}
    >
      {showAvatar ? (
        <div className="flex items-center gap-3">
          <Skeleton width={40} height={40} rounded="rounded-full" />
          <div className="space-y-2">
            <Skeleton width={120} height={14} />
            <Skeleton width={80} height={12} />
          </div>
        </div>
      ) : null}

      <div className={`${showAvatar ? "mt-4" : ""} space-y-2.5`}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 1 ? "60%" : "100%"}
            height={14}
            rounded="rounded-lg"
          />
        ))}
      </div>

      {showMedia ? (
        <div className="mt-4">
          <Skeleton height={220} rounded="rounded-2xl" />
        </div>
      ) : null}
    </div>
  )
}