"use client"

import { useState } from "react"
import type { PostRenderInput } from "@/modules/post/types"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { EmptyState } from "@/shared/ui/EmptyState"
import { RestrictedStateShell } from "@/shared/ui/RestrictedStateShell"
import {
  CREATOR_CONTENT_TAB_LABELS,
  CREATOR_SURFACE_EMPTY_STATE,
  getCreatorContentVisibilityLabel,
  getCreatorRestrictedSurfaceState,
  getCreatorUpdateHeaderBadge,
  getCreatorUpdatePreviewText,
} from "./creator-surface-policy"



type CreatorContentTabPost = {
  id: string
  content: string | null
  createdAt: string
  renderInput?: PostRenderInput
  media?: Array<{
    id?: string
    url: string
    type?: "image" | "video" | "audio" | "file"
    mimeType?: string | null
    sortOrder?: number
  }>
  isLocked?: boolean
  status?: string | null
  visibility?: string | null
  publishedAt?: string | null
}

type CreatorContentTabsProps = {
  mediaPosts: CreatorContentTabPost[]
  updatePosts: CreatorContentTabPost[]
  isOwner: boolean
}

type UpdateSurfaceState = {
  isLocked: boolean
  isUpcoming: boolean
  isDraft: boolean
  visibilityLabel: string
  statusLabel: string
  statusTone: "info" | "neutral" | "subtle"
  previewText: string
  metaLabel: string
  cardClassName: string
  footerDotClassName: string
}

type UpdateRestrictedCallout = {
  badgeLabel: string
  badgeTone: "subtle" | "info"
  title: string
  description: string
  className: string
}


function getUpdateRestrictedCallout(
  type: "locked" | "upcoming"
): UpdateRestrictedCallout {
  const state = getCreatorRestrictedSurfaceState(type)

  return {
    badgeLabel: state.badgeLabel,
    badgeTone: state.badgeTone,
    title: state.title,
    description: state.description,
    className: state.className,
  }
}


function formatDate(value?: string | null) {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString()
}

function getUpdateSurfaceState(
  post: CreatorContentTabPost,
  isOwner: boolean
): UpdateSurfaceState {
  const isUpcoming = post.status === "scheduled"
  const isDraft = post.status === "draft"
  const isLocked = !isOwner && Boolean(post.isLocked)
  const headerBadge = getCreatorUpdateHeaderBadge(post.status)
  const previewText = getCreatorUpdatePreviewText({
    status: post.status,
    isLocked,
    isOwner,
    content: post.renderInput?.blockText ?? post.content,
  })

  const formattedDate = isUpcoming
    ? formatDate(post.publishedAt)
    : formatDate(post.createdAt)

  return {
    isLocked,
    isUpcoming,
    isDraft,
    visibilityLabel: getCreatorContentVisibilityLabel(post.visibility),
    statusLabel: headerBadge.label,
    statusTone: headerBadge.tone,
    previewText,
    metaLabel: isUpcoming
      ? `Scheduled · ${formattedDate || "TBA"}`
      : `Posted · ${formattedDate || "-"}`,
    cardClassName: isLocked
      ? "group rounded-3xl border border-zinc-700 bg-zinc-950/90 p-5 transition-all hover:border-zinc-600 hover:bg-zinc-900"
      : isUpcoming
        ? "group rounded-3xl border border-[#C2185B]/25 bg-zinc-950/85 p-5 transition-all hover:border-[#C2185B]/40 hover:bg-zinc-900/95"
        : isDraft
          ? "group rounded-3xl border border-zinc-700/80 bg-zinc-950/80 p-5 transition-all hover:border-zinc-600 hover:bg-zinc-900/90"
          : "group rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900/90",
    footerDotClassName: isLocked
      ? "bg-zinc-500"
      : isUpcoming
        ? "bg-[#C2185B]"
        : isDraft
          ? "bg-zinc-500"
          : "bg-zinc-600",
  }
}



function getPostTileState(post: CreatorContentTabPost, isOwner: boolean) {
  return {
    isLocked: !isOwner && Boolean(post.isLocked),
    isDraft: isOwner && post.status === "draft",
    extraMediaCount: Math.max((post.media?.length ?? 0) - 1, 0),
    media:
      post.renderInput?.primaryLockedPreviewMedia ??
      post.media?.[0],
  }
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

export function CreatorContentTabs({
  mediaPosts,
  updatePosts,
  isOwner,
}: CreatorContentTabsProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "updates">("posts")

  return (
    <section className="flex flex-col">
      <div className="-mx-4 border-y border-zinc-800 lg:-mx-0">
        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={`flex items-center justify-center border-b-2 py-3 ${
              activeTab === "posts"
                ? "border-white text-white"
                : "border-transparent text-zinc-500"
            }`}
          >
            <span className="text-sm font-semibold">
              {CREATOR_CONTENT_TAB_LABELS.posts}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("updates")}
            className={`flex items-center justify-center border-b-2 py-3 ${
              activeTab === "updates"
                ? "border-white text-white"
                : "border-transparent text-zinc-500"
            }`}
          >
            <span className="text-sm font-semibold">
              {CREATOR_CONTENT_TAB_LABELS.updates}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "posts" ? (
        mediaPosts.length > 0 ? (
          <div className="mt-4 -mx-4 grid grid-cols-3 gap-[2px] lg:mx-0">
            {mediaPosts.map((post) => {
              const { isLocked, isDraft, extraMediaCount, media } =
                getPostTileState(post, isOwner)
              const lockedOverlayState = isLocked
                ? getCreatorRestrictedSurfaceState("locked")
                : null

              return (
                <a
                  key={post.id}
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
            })}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title={CREATOR_SURFACE_EMPTY_STATE.postsTab.title}
              description={CREATOR_SURFACE_EMPTY_STATE.postsTab.description}
            />
          </div>
        )
      ) : updatePosts.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          {updatePosts.map((post) => {
            const updateState = getUpdateSurfaceState(post, isOwner)
            const lockedCallout = updateState.isLocked
              ? getUpdateRestrictedCallout("locked")
              : null
            const upcomingCallout = updateState.isUpcoming
              ? getUpdateRestrictedCallout("upcoming")
              : null

            return (
              <a
                key={post.id}
                href={`/post/${post.id}`}
                className={updateState.cardClassName}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={updateState.statusLabel}
                      tone={updateState.statusTone}
                    />
                    <StatusBadge
                      label={updateState.visibilityLabel}
                      tone="subtle"
                    />
                  </div>

                  <span className="text-xs font-medium text-zinc-600 transition group-hover:text-zinc-400">
                    View post →
                  </span>
                </div>

                <div className="mt-4 min-h-[84px]">
                  {updateState.isLocked && lockedCallout
                    ? renderUpdateRestrictedCallout(lockedCallout)
                    : updateState.isUpcoming && upcomingCallout
                      ? renderUpdateRestrictedCallout(upcomingCallout)
                      : (
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
          })}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title={CREATOR_SURFACE_EMPTY_STATE.updatesTab.title}
            description={CREATOR_SURFACE_EMPTY_STATE.updatesTab.description}
          />
        </div>
      )}
    </section>
  )
}
