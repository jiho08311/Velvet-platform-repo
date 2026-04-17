"use client"

import { useState } from "react"

type CreatorContentTabPost = {
  id: string
  content: string | null
  created_at: string
  media?: Array<{
    id?: string
    url: string
    type?: "image" | "video" | "audio" | "file"
  }>
  isLocked?: boolean
  status?: string | null
  visibility?: string | null
  publishedAt?: string | null
  published_at?: string | null
}

type CreatorContentTabsProps = {
  mediaPosts: CreatorContentTabPost[]
  updatePosts: CreatorContentTabPost[]
  isOwner: boolean
}

function formatDate(value?: string | null) {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString()
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
            <span className="text-sm font-semibold">Posts</span>
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
            <span className="text-sm font-semibold">Updates</span>
          </button>
        </div>
      </div>

      {activeTab === "posts" ? (
        mediaPosts.length > 0 ? (
          <div className="mt-4 -mx-4 grid grid-cols-3 gap-[2px] lg:mx-0">
            {mediaPosts.map((post) => {
              const media = post.media?.[0]
              const mediaCount = post.media?.length ?? 0
              const extraMediaCount = mediaCount > 1 ? mediaCount - 1 : 0
              const isLocked = !isOwner && Boolean(post.isLocked)

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
                          isLocked ? "scale-[1.02] opacity-75 blur-[2px]" : "group-hover:scale-[1.02]"
                        }`}
                      />
                    ) : (
                      <img
                        src={media.url}
                        alt=""
                        className={`h-full w-full object-cover transition duration-300 ${
                          isLocked ? "scale-[1.02] opacity-75 blur-[2px]" : "group-hover:scale-[1.02]"
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

                  {isOwner && post.status === "draft" ? (
                    <div className="absolute left-2 top-2 rounded-full bg-zinc-950/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      Draft
                    </div>
                  ) : null}

       {isLocked ? (
  <div className="absolute inset-0 flex items-center justify-center bg-black/20 px-4 text-center">
    <div className="rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white backdrop-blur">
      Locked
    </div>
  </div>
) : null}
                </a>
              )
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-zinc-500">
            No posts yet
          </div>
        )
      ) : updatePosts.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          {updatePosts.map((post) => {
            const visibilityLabel =
              post.visibility === "public"
                ? "Public"
                : post.visibility === "subscribers"
                  ? "Subscribers"
                  : post.visibility === "paid"
                    ? "Paid"
                    : "Post"

            const statusLabel =
              post.status === "scheduled"
                ? "Upcoming"
                : post.status === "draft"
                  ? "Draft"
                  : "Update"

            const previewText = post.content?.trim() || "No content"
            const dateLabel =
              post.status === "scheduled"
                ? formatDate(post.publishedAt ?? post.published_at)
                : formatDate(post.created_at)

            const isLocked = !isOwner && Boolean(post.isLocked)

            return (
              <a
                key={post.id}
                href={`/post/${post.id}`}
                className="group rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900/90"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {post.status === "scheduled" ? (
                      <span className="rounded-full bg-[#C2185B] px-2.5 py-1 text-[11px] font-semibold text-white">
                        {statusLabel}
                      </span>
                    ) : post.status === "draft" ? (
                      <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                        {statusLabel}
                      </span>
                    ) : (
                      <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-zinc-300">
                        {statusLabel}
                      </span>
                    )}

                    <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                      {visibilityLabel}
                    </span>
                  </div>

                <span className="text-xs font-medium text-zinc-600 transition group-hover:text-zinc-400">
  View post →
</span>
                </div>

             <div className="mt-4 min-h-[84px]">
  <p className="line-clamp-4 whitespace-pre-wrap text-[15px] leading-6 text-zinc-100">
    {isLocked ? "Subscribe to read this update." : previewText}
  </p>
</div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
                  <p className="text-xs text-zinc-500">
                    {post.status === "scheduled"
                      ? `Scheduled · ${dateLabel || "TBA"}`
                      : `Posted · ${dateLabel || "-"}`}
                  </p>

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
        <div className="py-12 text-center text-sm text-zinc-500">
          No updates yet
        </div>
      )}
    </section>
  )
}