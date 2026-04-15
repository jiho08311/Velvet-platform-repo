import { Avatar } from "@/shared/ui/Avatar"

type UpcomingCardProps = {
  title: string
  previewText: string | null
  scheduledAt: string
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

function formatHour(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
  }).format(date)
}

function formatScheduledAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
  const startOfTarget = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )

  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffHours >= 1 && diffHours < 12) {
    return `In ${diffHours} hours`
  }

  if (diffDays === 0) {
    return `Tonight ${formatHour(date)}`
  }

  if (diffDays === 1) {
    return `Tomorrow ${formatHour(date)}`
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export function UpcomingCard({
  title,
  previewText: _previewText,
  scheduledAt,
  creator,
}: UpcomingCardProps) {
  const creatorName = creator.displayName ?? creator.username

  return (
    <section className="px-4 py-3">
      <div className="rounded-3xl border border-[#C2185B]/35 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 p-5 shadow-[0_0_0_1px_rgba(194,24,91,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F472B6]">
              Upcoming
            </p>

            <h2 className="mt-3 truncate text-lg font-semibold text-white">
              {creatorName}
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              {title}
            </p>
          </div>

          <p className="shrink-0 rounded-full border border-[#C2185B]/25 bg-[#C2185B]/10 px-3 py-1.5 text-xs font-medium text-[#F9A8D4]">
            {formatScheduledAt(scheduledAt)}
          </p>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Avatar
            src={creator.avatarUrl}
            alt={creator.username}
            fallback={creatorName}
            size="md"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {creatorName}
            </p>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Velvet drop
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}