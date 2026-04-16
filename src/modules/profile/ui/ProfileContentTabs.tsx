"use client"

import { useState } from "react"
import type { MyPostListItem } from "@/modules/post/server/get-my-posts"

type Props = {
  mediaPosts: MyPostListItem[]
  updatePosts: MyPostListItem[]
}

export function ProfileContentTabs({
  mediaPosts,
  updatePosts,
}: Props) {
  const [activeTab, setActiveTab] = useState<"posts" | "updates">("posts")

  return (
    <div className="flex flex-col">
      {/* Tabs */}
      <div className="mt-2 -mx-4 border-y border-zinc-800 md:-mx-0">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center justify-center py-3 border-b-2 ${
              activeTab === "posts"
                ? "border-white text-white"
                : "border-transparent text-zinc-500"
            }`}
          >
            <span className="text-sm font-semibold">Posts</span>
          </button>

          <button
            onClick={() => setActiveTab("updates")}
            className={`flex items-center justify-center py-3 border-b-2 ${
              activeTab === "updates"
                ? "border-white text-white"
                : "border-transparent text-zinc-500"
            }`}
          >
            <span className="text-sm font-semibold">Updates</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "posts" ? (
        mediaPosts.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-[2px] md:grid-cols-3">
            {mediaPosts.map((post) => {
              const media = post.media?.[0]
              const mediaCount = post.media?.length ?? 0
              const extraMediaCount = mediaCount > 1 ? mediaCount - 1 : 0

              return (
                <a
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="relative aspect-square overflow-hidden bg-zinc-800"
                >
                  {media?.url ? (
                    media.type === "video" ? (
                      <video
                        src={media.url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={media.url}
                        alt=""
                        className="h-full w-full object-cover hover:opacity-90"
                      />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                      No media
                    </div>
                  )}

                  {extraMediaCount > 0 && (
                    <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      +{extraMediaCount}
                    </div>
                  )}

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
          <div className="p-10 text-center text-sm text-zinc-500">
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
const previewMedia = post.media?.[0]
const extraMediaCount = (post.media?.length ?? 0) > 1 ? (post.media?.length ?? 0) - 1 : 0
            return (
              <a
                key={post.id}
                href={`/post/${post.id}`}
                className="group rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {post.status === "scheduled" ? (
                      <span className="rounded-full bg-pink-600/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                        {statusLabel}
                      </span>
                    ) : post.status === "draft" ? (
                      <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-white">
                        {statusLabel}
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-zinc-300">
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
                    {post.text || "No content"}
                  </p>
                </div>


{previewMedia?.url ? (
  <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
    <div className="relative aspect-[16/10] w-full overflow-hidden">
      {previewMedia.type === "video" ? (
        <video
          src={previewMedia.url}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      ) : (
        <img
          src={previewMedia.url}
          alt=""
          className="h-full w-full object-cover"
        />
      )}

      {extraMediaCount > 0 ? (
        <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
          +{extraMediaCount}
        </div>
      ) : null}
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
        <div className="p-10 text-center text-sm text-zinc-500">
          No updates yet
        </div>
      )}
    </div>
  )
}