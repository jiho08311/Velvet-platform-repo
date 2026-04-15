import Link from "next/link"
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
    (startOfTarget.getTime() - startOfToday.getTime()) /
      (1000 * 60 * 60 * 24)
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
  title: _title,
  previewText: _previewText,
  scheduledAt,
  creator,
}: UpcomingCardProps) {
  const creatorName = creator.displayName ?? creator.username

  return (
    <section className="px-4 py-3">
      <div className="rounded-3xl border-2 border-[#C2185B]/40 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
         <img
  src="/logo-mark-removebg.png"
  alt=""
  aria-hidden="true"
  className="h-8 w-8 animate-pulse object-contain"
/>

            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C2185B]">
              Upcoming
            </p>
          </div>

          <p className="shrink-0 rounded-full border border-[#C2185B]/25 bg-[#C2185B]/10 px-3 py-1.5 text-xs font-medium text-[#C2185B]">
            {formatScheduledAt(scheduledAt)}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Link
            href={`/creator/${creator.username}`}
            className="shrink-0"
          >
            <Avatar
              src={creator.avatarUrl}
              alt={creator.username}
              fallback={creatorName}
              size="md"
            />
          </Link>

          <div className="min-w-0">
            <Link
              href={`/creator/${creator.username}`}
              className="block"
            >
              <p className="truncate text-base font-semibold text-zinc-900 transition hover:opacity-80">
                {creatorName}
              </p>
            </Link>

            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Velvet drop
            </p>
          </div>
        </div>
      </div>

    
    </section>
  )
}