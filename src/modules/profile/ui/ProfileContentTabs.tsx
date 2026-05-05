"use client"

import { useState } from "react"
import type { MyPostListItem } from "@/modules/post/public/get-my-posts"

type ProfileContentTab = "posts" | "updates"
type PreviewMediaItem = {
  url: string
  type: string
}

type Props = {
  mediaPosts: MyPostListItem[]
  updatePosts: MyPostListItem[]
}

const tabButtonBaseClass = "flex items-center justify-center py-3 border-b-2"
const activeTabClass = "border-white text-white"
const inactiveTabClass = "border-transparent text-zinc-500"
const tabLabelClass = "text-sm font-semibold"
const emptyStateClass = "p-10 text-center text-sm text-zinc-500"
const mediaCountBadgeClass =
  "absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur"
const mediaImageClass = "h-full w-full object-cover"
const updatePillClass =
  "rounded-full px-2.5 py-1 text-[11px] font-semibold"

function getTabButtonClass(isActive: boolean) {
  return `${tabButtonBaseClass} ${isActive ? activeTabClass : inactiveTabClass}`
}

function MediaCountBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null
  }

  return <div className={mediaCountBadgeClass}>+{count}</div>
}

function PreviewMedia({
  media,
  variant,
}: {
  media: PreviewMediaItem
  variant: "grid" | "update"
}) {
  if (media.type === "video") {
    return (
      <video
        src={media.url}
        autoPlay={variant === "grid"}
        muted
        loop={variant === "grid"}
        playsInline
        preload="metadata"
        className={mediaImageClass}
      />
    )
  }

  return (
    <img
      src={media.url}
      alt=""
      className={variant === "grid" ? `${mediaImageClass} hover:opacity-90` : mediaImageClass}
    />
  )
}

export function ProfileContentTabs({
  mediaPosts,
  updatePosts,
}: Props) {
  const [activeTab, setActiveTab] = useState<ProfileContentTab>("posts")

  function getPreviewMedia(post: MyPostListItem) {
    return post.renderInput.primaryLockedPreviewMedia ?? post.media?.[0]
  }

  function getMediaCount(post: MyPostListItem) {
    return post.renderInput.blockMedia.length || post.media?.length || 0
  }

  function getPreviewText(post: MyPostListItem) {
    return post.renderInput.blockText || post.content || "No content"
  }

  return (
    <div className="flex flex-col">
      {/* Tabs */}
      <div className="mt-2 -mx-4 border-y border-zinc-800 md:-mx-0">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setActiveTab("posts")}
            className={getTabButtonClass(activeTab === "posts")}
          >
            <span className={tabLabelClass}>Posts</span>
          </button>

          <button
            onClick={() => setActiveTab("updates")}
            className={getTabButtonClass(activeTab === "updates")}
          >
            <span className={tabLabelClass}>Updates</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "posts" ? (
        mediaPosts.length > 0 ? (
          <div className="mt-4 -mx-4 grid grid-cols-3 gap-[2px] md:-mx-0 md:grid-cols-3">
            {mediaPosts.map((post) => {
              const media = getPreviewMedia(post)
              const mediaCount = getMediaCount(post)
              const extraMediaCount = mediaCount > 1 ? mediaCount - 1 : 0

              return (
                <a
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="relative aspect-square overflow-hidden bg-zinc-800"
                >
                  {media?.url ? (
                    <PreviewMedia media={media} variant="grid" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                      No media
                    </div>
                  )}

                  <MediaCountBadge count={extraMediaCount} />

                  {post.status === "draft" && (
                    <div className="absolute left-2 top-2 rounded-full bg-zinc-900/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      Draft
                    </div>
                  )}
                </a>
              )
            })}
          </div>
        ) : (
          <div className={emptyStateClass}>No posts yet</div>
        )
      ) : updatePosts.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          {updatePosts.map((post) => {
            const visibilityLabel =
              post.visibility === "public"
                ? "Public"
                : post.visibility === "subscribers"
                  ? "Subscribers"
                  : "Paid"

            const statusLabel =
              post.status === "scheduled"
                ? "Scheduled"
                : post.status === "draft"
                  ? "Draft"
                  : "Published"

            const metaDate =
              post.status === "scheduled" && post.publishedAt
                ? `Scheduled · ${new Date(post.publishedAt).toLocaleDateString()}`
                : `Created · ${new Date(post.createdAt).toLocaleDateString()}`
            const previewMedia = getPreviewMedia(post)
            const mediaCount = getMediaCount(post)
            const extraMediaCount = mediaCount > 1 ? mediaCount - 1 : 0

            return (
              <a
                key={post.id}
                href={`/post/${post.id}`}
                className="group rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {post.status === "scheduled" ? (
                      <span className={`${updatePillClass} bg-pink-600/90 text-white`}>
                        {statusLabel}
                      </span>
                    ) : post.status === "draft" ? (
                      <span className={`${updatePillClass} bg-zinc-800 text-white`}>
                        {statusLabel}
                      </span>
                    ) : (
                      <span className={`${updatePillClass} bg-zinc-900 text-zinc-300`}>
                        {statusLabel}
                      </span>
                    )}

                    <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                      {visibilityLabel}
                    </span>
                  </div>

                  <span className="text-xs text-zinc-600 transition group-hover:text-zinc-400">
                    View post →
                  </span>
                </div>

                <div className="mt-4 min-h-[72px]">
                  <p className="line-clamp-4 whitespace-pre-wrap text-[15px] font-medium leading-6 text-zinc-100">
                    {getPreviewText(post)}
                  </p>
                </div>
                {previewMedia?.url ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <PreviewMedia media={previewMedia} variant="update" />

                      <MediaCountBadge count={extraMediaCount} />
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
                  <p className="text-xs text-zinc-500">{metaDate}</p>

                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                    Update
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      ) : (
        <div className={emptyStateClass}>No updates yet</div>
      )}
    </div>
  )
}
