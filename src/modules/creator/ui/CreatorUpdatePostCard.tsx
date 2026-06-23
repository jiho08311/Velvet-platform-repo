"use client"

import { RestrictedStateShell } from "@/shared/ui/RestrictedStateShell"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import {
  getUpdateRestrictedCallout,
  getUpdateSurfaceState,
  type UpdateRestrictedCallout,
} from "./creator-content-surface-state"
import type { CreatorContentTabPost } from "./creator-content-tabs-types"

type CreatorUpdatePostCardProps = {
  post: CreatorContentTabPost
  isOwner: boolean
}

function renderUpdateRestrictedCallout(callout: UpdateRestrictedCallout) {
  return (
    <RestrictedStateShell
      align="left"
      badgeLabel={callout.badgeLabel}
      badgeTone={callout.badgeTone}
      title={callout.title}
      description={callout.description}
      className={callout.className}
    />
  )
}

export function CreatorUpdatePostCard({
  post,
  isOwner,
}: CreatorUpdatePostCardProps) {
  const updateState = getUpdateSurfaceState(post, isOwner)
  const lockedCallout = updateState.isLocked
    ? getUpdateRestrictedCallout("locked")
    : null
  const upcomingCallout = updateState.isUpcoming
    ? getUpdateRestrictedCallout("upcoming")
    : null

  return (
    <a href={`/post/${post.id}`} className={updateState.cardClassName}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={updateState.statusLabel}
            tone={updateState.statusTone}
          />
          <StatusBadge label={updateState.visibilityLabel} tone="subtle" />
        </div>

        <span className="text-xs font-medium text-zinc-600 transition group-hover:text-zinc-400">
          View post →
        </span>
      </div>

      <div className="mt-4 min-h-[84px]">
        {updateState.isLocked && lockedCallout ? (
          renderUpdateRestrictedCallout(lockedCallout)
        ) : updateState.isUpcoming && upcomingCallout ? (
          renderUpdateRestrictedCallout(upcomingCallout)
        ) : (
          <p className="line-clamp-4 whitespace-pre-wrap text-[15px] leading-6 text-zinc-100">
            {updateState.previewText}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
        <p className="text-xs text-zinc-500">{updateState.metaLabel}</p>

        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <span
            className={`h-1.5 w-1.5 rounded-full ${updateState.footerDotClassName}`}
          />
          Update
        </div>
      </div>
    </a>
  )
}
