"use client"

import Link from "next/link"
import { Avatar } from "@/shared/ui/Avatar"
import { Card } from "@/shared/ui/Card"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { formatInUserTimeZone } from "@/shared/lib/date-time"
import { FEED_UPCOMING_STATE } from "./feed-surface-policy"

type UpcomingCardProps = {
  title?: string
  previewText: string | null
  scheduledAt: string
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

export function UpcomingCard({
  title = FEED_UPCOMING_STATE.defaultTitle,
  previewText,
  scheduledAt,
  creator,
}: UpcomingCardProps) {
  const creatorName = creator.displayName ?? creator.username
  const hasPreviewText = Boolean(previewText?.trim())

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <StatusBadge
          label={FEED_UPCOMING_STATE.badgeLabel}
          tone={FEED_UPCOMING_STATE.badgeTone}
        />

        <p className="shrink-0 text-xs font-medium text-zinc-400">
          {formatInUserTimeZone(scheduledAt, { withTime: true })}
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
            <p className="truncate text-base font-semibold text-white transition hover:opacity-80">
              {creatorName}
            </p>
          </Link>

          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            {title}
          </p>
        </div>
      </div>

      {hasPreviewText ? (
        <p className="mt-3 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
          {previewText}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Link
          href={FEED_UPCOMING_STATE.actionHref}
          className="text-xs font-medium text-zinc-300 transition hover:text-white hover:underline"
        >
          {FEED_UPCOMING_STATE.actionLabel}
        </Link>
      </div>
    </Card>
  )
}