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
      className={`rounded-md border border-zinc-200 bg-white p-4 shadow-sm ${className}`}
    >
      {showAvatar ? (
        <div className="flex items-center gap-3">
          <Skeleton width={36} height={36} rounded="rounded-full" />
          <Skeleton width={140} height={14} />
        </div>
      ) : null}

      <div className={`${showAvatar ? "mt-4" : ""} space-y-2`}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 1 ? "50%" : "100%"}
            height={14}
          />
        ))}
      </div>

      {showMedia ? (
        <div className="mt-4">
          <Skeleton height={140} rounded="rounded-sm" />
        </div>
      ) : null}
    </div>
  )
}