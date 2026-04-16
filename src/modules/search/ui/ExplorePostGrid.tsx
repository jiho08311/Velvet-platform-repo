"use client"

import { useState } from "react"

type ExplorePostGridItem = {
  id: string
  postId: string
  creatorUsername: string
  creatorDisplayName: string | null
  imageUrl: string
  mediaType?: "image" | "video"
  mediaCount?: number
}

type ExplorePostGridProps = {
  posts: ExplorePostGridItem[]
}

export function ExplorePostGrid({ posts }: ExplorePostGridProps) {
  const [selected, setSelected] = useState<string | null>(null)

  if (posts.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center rounded-3xl bg-zinc-900 p-10 text-center">
        <div className="text-4xl">🖼️</div>

        <p className="mt-4 text-base font-semibold text-white">
          No explore posts yet
        </p>

        <p className="mt-1 text-sm text-zinc-400">
          Public image posts will appear here.
        </p>
      </section>
    )
  }

  return (
    <>
      <section className="grid grid-cols-2 gap-1 md:grid-cols-3">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => setSelected(post.imageUrl)}
            className="group block cursor-pointer overflow-hidden bg-zinc-900"
          >
            <div className="relative aspect-square overflow-hidden bg-zinc-950">
              {post.mediaType === "video" ? (
                <video
                  src={post.imageUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={post.imageUrl}
                  alt={post.creatorDisplayName ?? post.creatorUsername}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]"
                />
              )}

              {post.mediaCount && post.mediaCount > 1 ? (
                <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  +{post.mediaCount - 1}
                </div>
              ) : null}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2">
                <p className="truncate text-xs font-medium text-white">
                  {post.creatorDisplayName ?? post.creatorUsername}
                </p>
                <p className="truncate text-[11px] text-zinc-300">
                  @{post.creatorUsername}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setSelected(null)}
        >
          <img
            src={selected}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      ) : null}
    </>
  )
}