"use client"

import type { DiscoveryPostLinkItem } from "../discovery-contract"

type ExplorePostGridEmptyStateProps = {
  title: string
  description: string
}

const mediaTileFrameClassName =
  "relative aspect-square overflow-hidden bg-zinc-950"
const mediaTileContentClassName = "h-full w-full object-cover"
const creatorOverlayClassName =
  "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2"

export function ExplorePostGridEmptyState({
  title,
  description,
}: ExplorePostGridEmptyStateProps) {
  return (
    <section className="flex flex-col items-center justify-center rounded-3xl bg-zinc-900 p-10 text-center">
      <div className="text-4xl">🖼️</div>

      <p className="mt-4 text-base font-semibold text-white">{title}</p>

      <p className="mt-1 text-sm text-zinc-400">{description}</p>
    </section>
  )
}

type ExplorePostGridTileProps = {
  post: DiscoveryPostLinkItem
  onOpen: (post: DiscoveryPostLinkItem) => void
}

export function ExplorePostGridTile({
  post,
  onOpen,
}: ExplorePostGridTileProps) {
  const creatorName = post.creatorDisplayName ?? post.creatorUsername

  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      className="group block w-full cursor-pointer overflow-hidden bg-zinc-900 p-0 text-left"
    >
      <div className={mediaTileFrameClassName}>
        {post.mediaType === "video" ? (
          <video
            src={post.imageUrl}
            autoPlay
            muted
            loop
            playsInline
            className={mediaTileContentClassName}
          />
        ) : (
          <img
            src={post.imageUrl}
            alt={creatorName}
            className={`${mediaTileContentClassName} transition duration-300 group-hover:scale-[1.05]`}
          />
        )}

        {post.mediaCount && post.mediaCount > 1 ? (
          <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
            +{post.mediaCount - 1}
          </div>
        ) : null}

        <div className={creatorOverlayClassName}>
          <p className="truncate text-xs font-medium text-white">
            {creatorName}
          </p>
          <p className="truncate text-[11px] text-zinc-300">
            @{post.creatorUsername}
          </p>
        </div>
      </div>
    </button>
  )
}
