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
  previewText,
  scheduledAt,
  creator,
}: UpcomingCardProps) {
  const creatorName = creator.displayName ?? creator.username

  return (
    <section className="px-0 py-1">
      <div className="space-y-3 border-b border-zinc-800/70 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-400/90">
              Upcoming
            </p>

            <h2 className="truncate text-[15px] font-semibold text-white">
              {title}
            </h2>
          </div>

          <p className="shrink-0 text-xs font-medium text-zinc-500">
            {formatScheduledAt(scheduledAt)}
          </p>
        </div>

        {previewText ? (
          <p className="line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
            {previewText}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
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
            <p className="truncate text-xs text-zinc-400">
              @{creator.username}
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-500">
          공개되면 여기서 바로 확인할 수 있어요.
        </p>
      </div>
    </section>
  )
}