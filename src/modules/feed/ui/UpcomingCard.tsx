import Link from "next/link"
import { Avatar } from "@/shared/ui/Avatar"
import { formatInUserTimeZone } from "@/shared/lib/date-time"

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
              className="h-10 w-10 animate-pulse object-contain"
            />

            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C2185B] animate-pulse">
              Upcoming
            </p>
          </div>

          <p className="shrink-0 rounded-full border border-[#C2185B]/25 bg-[#C2185B]/10 px-3 py-1.5 text-xs font-medium text-[#C2185B]">
    {formatInUserTimeZone(scheduledAt, { withTime: true })}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Link href={`/creator/${creator.username}`} className="shrink-0">
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

        <div className="mt-3 flex justify-end">
          <Link
            href="/drops"
            className="text-xs font-medium !text-zinc-700 transition hover:underline"
          >
            See upcoming posts →
          </Link>
        </div>
      </div>
    </section>
  )
}