"use client"

import { StatusBadge } from "@/shared/ui/StatusBadge"
import { getCreatorRestrictedSurfaceState } from "./creator-surface-policy"
import { getPostTileState } from "./creator-content-surface-state"
import type { CreatorContentTabPost } from "./creator-content-tabs-types"

type CreatorMediaPostTileProps = {
  post: CreatorContentTabPost
  isOwner: boolean
}

export function CreatorMediaPostTile({
  post,
  isOwner,
}: CreatorMediaPostTileProps) {
  const { isLocked, isDraft, extraMediaCount, media } =
    getPostTileState(post, isOwner)
  const lockedOverlayState = isLocked
    ? getCreatorRestrictedSurfaceState("locked")
    : null

  return (
    <a
      href={`/post/${post.id}`}
      className="group relative aspect-square overflow-hidden bg-zinc-900"
    >
      {media?.url ? (
        media.type === "video" ? (
          <video
            src={media.url}
            muted
            playsInline
            preload="metadata"
            className={`h-full w-full object-cover transition duration-300 ${
              isLocked
                ? "scale-[1.02] opacity-75 blur-[2px]"
                : "group-hover:scale-[1.02]"
            }`}
          />
        ) : (
          <img
            src={media.url}
            alt=""
            className={`h-full w-full object-cover transition duration-300 ${
              isLocked
                ? "scale-[1.02] opacity-75 blur-[2px]"
                : "group-hover:scale-[1.02]"
            }`}
          />
        )
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-zinc-500">
          No media
        </div>
      )}

      {extraMediaCount > 0 ? (
        <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
          +{extraMediaCount}
        </div>
      ) : null}

      {isDraft ? (
        <StatusBadge
          label="Draft"
          tone="neutral"
          className="absolute left-2 top-2 backdrop-blur"
        />
      ) : null}

      {isLocked && lockedOverlayState ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 px-3 text-center">
          <div className="flex max-w-[140px] flex-col items-center">
            <StatusBadge
              label={lockedOverlayState.badgeLabel}
              tone={lockedOverlayState.badgeTone}
              className="border-white/15 bg-black/55 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-white backdrop-blur"
            />

            <p className="mt-2 text-[11px] font-medium leading-4 text-white/85">
              {lockedOverlayState.description}
            </p>
          </div>
        </div>
      ) : null}
    </a>
  )
}
