import { CREATOR_PAGE_PRESENTATION } from "@/modules/creator/public/creator-page-ui"
import { formatCount } from "./creator-page-format"

export function CreatorStatsSection({
  mediaPostCount,
  subscriberCount,
  updatePostCount,
}: {
  mediaPostCount: number
  subscriberCount?: number | null
  updatePostCount: number
}) {
  return (
    <div className="mt-4 flex items-center gap-8 text-sm text-zinc-400">
      <div>
        <p className="text-base font-semibold text-white">{mediaPostCount}</p>
        <p className="mt-1 text-zinc-500">
          {CREATOR_PAGE_PRESENTATION.stats.posts}
        </p>
      </div>

      <div>
        <p className="text-base font-semibold text-white">{updatePostCount}</p>
        <p className="mt-1 text-zinc-500">
          {CREATOR_PAGE_PRESENTATION.stats.updates}
        </p>
      </div>

      <div>
        <p className="text-base font-semibold text-white">
          {formatCount(subscriberCount)}
        </p>
        <p className="mt-1 text-zinc-500">
          {CREATOR_PAGE_PRESENTATION.stats.subscribers}
        </p>
      </div>
    </div>
  )
}
