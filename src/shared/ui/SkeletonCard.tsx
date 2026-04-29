import { Skeleton } from "./Skeleton"

const skeletonCardClassName =
  "rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5"
const skeletonCardAvatarSize = 40
const skeletonCardTitleWidth = 120
const skeletonCardTitleHeight = 14
const skeletonCardSubtitleWidth = 80
const skeletonCardSubtitleHeight = 12
const skeletonCardLineHeight = 14
const skeletonCardLastLineWidth = "60%"
const skeletonCardMediaHeight = 220

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
      className={`${skeletonCardClassName} ${className}`}
    >
      {showAvatar ? (
        <div className="flex items-center gap-3">
          <Skeleton
            width={skeletonCardAvatarSize}
            height={skeletonCardAvatarSize}
            rounded="rounded-full"
          />
          <div className="space-y-2">
            <Skeleton
              width={skeletonCardTitleWidth}
              height={skeletonCardTitleHeight}
            />
            <Skeleton
              width={skeletonCardSubtitleWidth}
              height={skeletonCardSubtitleHeight}
            />
          </div>
        </div>
      ) : null}

      <div className={`${showAvatar ? "mt-4" : ""} space-y-2.5`}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 1 ? skeletonCardLastLineWidth : "100%"}
            height={skeletonCardLineHeight}
            rounded="rounded-lg"
          />
        ))}
      </div>

      {showMedia ? (
        <div className="mt-4">
          <Skeleton height={skeletonCardMediaHeight} rounded="rounded-2xl" />
        </div>
      ) : null}
    </div>
  )
}
