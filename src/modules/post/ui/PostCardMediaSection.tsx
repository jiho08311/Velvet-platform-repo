"use client"

import type {
  PostBlock,
  PostRenderMediaItem,
} from "@/modules/post/types"

export type PostCardMediaEntry = {
  media: PostRenderMediaItem
  block?: PostBlock
}

type PostCardMediaSectionProps = {
  items: PostRenderMediaItem[]
  mediaEntries?: PostCardMediaEntry[]
  fallbackEntries: PostCardMediaEntry[]
  isCarousel?: boolean
  currentIndex: number
  isVideoReady: boolean
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void
  onVideoReady: () => void
}

function getFilterStyle(filter?: string) {
  switch (filter) {
    case "warm":
      return { filter: "sepia(0.3) saturate(1.2)" }
    case "cool":
      return { filter: "hue-rotate(180deg) saturate(1.1)" }
    case "mono":
      return { filter: "grayscale(1)" }
    case "vivid":
      return { filter: "contrast(1.2) saturate(1.4)" }
    default:
      return { filter: "none" }
  }
}

function resolveMediaEntries(params: {
  items: PostRenderMediaItem[]
  mediaEntries?: PostCardMediaEntry[]
  fallbackEntries: PostCardMediaEntry[]
}) {
  if (params.mediaEntries && params.mediaEntries.length > 0) {
    return params.mediaEntries
  }

  return params.fallbackEntries.filter((entry) =>
    params.items.some((item) => item.id === entry.media.id)
  )
}

function PostCardSingleMedia({
  item,
  alt,
  block,
  isVideoReady,
  videoRefs,
  onVideoReady,
}: {
  item: PostRenderMediaItem
  alt: string
  block?: PostBlock
  isVideoReady: boolean
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>
  onVideoReady: () => void
}) {
  const mediaUrl = item.url?.trim() ?? ""
  if (!mediaUrl) return null

  if (item.type === "video") {
    const trimStart = block?.editorState?.video?.trimStart ?? 0
    const trimEnd = block?.editorState?.video?.trimEnd ?? null
    const muted = block?.editorState?.video?.muted ?? true
    const videoKey = item.id ?? item.url

    return (
      <video
        ref={(node) => {
          videoRefs.current[videoKey] = node
        }}
        src={mediaUrl}
        muted={muted}
        loop={trimEnd === null}
        playsInline
        autoPlay
        onClick={(event) => {
          const video = event.currentTarget
          if (video.paused) video.play()
          else video.pause()
        }}
        preload="metadata"
        onLoadedData={onVideoReady}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget
          if (trimStart > 0) {
            video.currentTime = trimStart
          }
        }}
        onTimeUpdate={(event) => {
          const video = event.currentTarget

          if (
            trimEnd !== null &&
            trimEnd > trimStart &&
            video.currentTime >= trimEnd
          ) {
            video.pause()
          }
        }}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isVideoReady ? "opacity-100" : "opacity-0"
        }`}
      />
    )
  }

  if (item.type === "audio") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-4">
        <audio controls className="w-full">
          <source src={mediaUrl} />
        </audio>
      </div>
    )
  }

  if (item.type === "file") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-4">
        <a
          href={mediaUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-white hover:bg-zinc-800"
        >
          Open file
        </a>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <img
        src={mediaUrl}
        alt={alt}
        style={getFilterStyle(block?.editorState?.image?.filter)}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
      />

      {block?.editorState?.image?.overlayText?.text ? (
        <div
          className="pointer-events-none absolute left-1/2 top-[15%] -translate-x-1/2"
          style={{
            left: `${block.editorState.image.overlayText.x * 100}%`,
            top: `${block.editorState.image.overlayText.y * 100}%`,
            transform: `translate(-50%, -50%) scale(${
              block.editorState.image.overlayText.scale ?? 1
            })`,
          }}
        >
          <p className="whitespace-pre-wrap text-base font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
            {block.editorState.image.overlayText.text}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function PostCardMediaSection({
  items,
  mediaEntries,
  fallbackEntries,
  isCarousel = false,
  currentIndex,
  isVideoReady,
  videoRefs,
  onScroll,
  onVideoReady,
}: PostCardMediaSectionProps) {
  if (items.length === 0) return null

  const resolvedEntries = resolveMediaEntries({
    items,
    mediaEntries,
    fallbackEntries,
  })

  if (isCarousel) {
    return (
      <div className="relative">
        <div className="flex snap-x snap-mandatory overflow-x-auto" onScroll={onScroll}>
          {items.map((item, index) => {
            const matchedEntry = resolvedEntries.find(
              (entry) => entry.media.id === item.id
            )

            return (
              <div
                key={`${item.id ?? item.url}-${index}`}
                className="min-w-full snap-center"
              >
                <div className="aspect-[91/100] w-full overflow-hidden">
                  <PostCardSingleMedia
                    item={item}
                    alt={`Post media ${index + 1}`}
                    block={matchedEntry?.block}
                    isVideoReady={isVideoReady}
                    videoRefs={videoRefs}
                    onVideoReady={onVideoReady}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {items.length > 1 ? (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {items.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  index === currentIndex ? "bg-[#C2185B]" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-2">
      {items.map((item, index) => {
        const matchedEntry = resolvedEntries.find(
          (entry) => entry.media.id === item.id
        )

        return (
          <div
            key={`${item.id ?? item.url}-${index}`}
            className="aspect-[91/100] w-full overflow-hidden"
          >
            <PostCardSingleMedia
              item={item}
              alt={`Post media ${index + 1}`}
              block={matchedEntry?.block}
              isVideoReady={isVideoReady}
              videoRefs={videoRefs}
              onVideoReady={onVideoReady}
            />
          </div>
        )
      })}
    </div>
  )
}
