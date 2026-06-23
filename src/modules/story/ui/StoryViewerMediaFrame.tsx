"use client"

import type { Story, StoryMusic } from "../types"

type StoryViewerMediaFrameProps = {
  story: Story
  storyMusic: StoryMusic | null
  storyMusicStyle: NonNullable<StoryMusic["style"]>
  selectedFilterPreset: string
  musicStickerX: number
  musicStickerY: number
  videoRef: React.MutableRefObject<HTMLVideoElement | null>
  onProgressChange: (progress: number) => void
  onVideoEnded: () => void
}

function getStickerSymbol(preset: string) {
  if (preset === "sparkle") return "✨"
  if (preset === "heart") return "💖"
  if (preset === "fire") return "🔥"
  return "✨"
}

function getFilterStyle(preset?: string | null) {
  if (preset === "warm") {
    return { filter: "sepia(0.35) saturate(1.15) brightness(1.05)" }
  }

  if (preset === "cool") {
    return { filter: "saturate(0.9) hue-rotate(12deg) brightness(1.02)" }
  }

  if (preset === "mono") {
    return { filter: "grayscale(1) contrast(1.05)" }
  }

  if (preset === "vivid") {
    return { filter: "saturate(1.35) contrast(1.08)" }
  }

  return { filter: "none" }
}

export function StoryViewerMediaFrame({
  story,
  storyMusic,
  storyMusicStyle,
  selectedFilterPreset,
  musicStickerX,
  musicStickerY,
  videoRef,
  onProgressChange,
  onVideoEnded,
}: StoryViewerMediaFrameProps) {
  if (story.isLocked) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
        <div className="max-w-xs">
          <p className="text-lg font-semibold text-white">구독자 전용 스토리</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            이 스토리는 구독자만 볼 수 있습니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {story.mediaType === "video" ? (
        <video
          ref={videoRef}
          src={story.mediaUrl}
          className="h-full w-full object-contain"
          style={getFilterStyle(selectedFilterPreset)}
          autoPlay
          muted
          playsInline
          controls={false}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget
            const duration = video.duration

            if (!Number.isFinite(duration) || duration <= 0) {
              onProgressChange(0)
              return
            }

            onProgressChange(Math.min(100, (video.currentTime / duration) * 100))
          }}
          onTimeUpdate={(event) => {
            const video = event.currentTarget
            const duration = video.duration

            if (!Number.isFinite(duration) || duration <= 0) {
              onProgressChange(0)
              return
            }

            onProgressChange(Math.min(100, (video.currentTime / duration) * 100))
          }}
          onEnded={onVideoEnded}
        />
      ) : (
        <img
          src={story.mediaUrl}
          alt={story.text ?? "Story media"}
          className="h-full w-full object-contain"
          style={getFilterStyle(selectedFilterPreset)}
        />
      )}

      {storyMusic ? (
        <div
          className="pointer-events-none absolute z-20 max-w-[78%] -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(musicStickerX * 100).toFixed(2)}%`,
            top: `${(musicStickerY * 100).toFixed(2)}%`,
          }}
        >
          <div
            className={`border border-white/10 bg-black/65 backdrop-blur-sm ${
              storyMusicStyle === "minimal"
                ? "rounded-full px-3 py-1.5"
                : storyMusicStyle === "bold"
                  ? "rounded-3xl px-4 py-3 shadow-2xl"
                  : "rounded-2xl px-3 py-2 shadow-lg"
            }`}
          >
            {storyMusicStyle === "minimal" ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">🎵</span>
                <p className="max-w-[160px] truncate text-xs font-medium text-white">
                  {storyMusic.title ?? "Story music"}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {storyMusic.artworkUrl ? (
                  <img
                    src={storyMusic.artworkUrl}
                    alt={storyMusic.title ?? "Story music"}
                    className={`object-cover ${
                      storyMusicStyle === "bold"
                        ? "h-12 w-12 rounded-2xl"
                        : "h-10 w-10 rounded-xl"
                    }`}
                  />
                ) : (
                  <div
                    className={`flex items-center justify-center bg-white/10 text-white ${
                      storyMusicStyle === "bold"
                        ? "h-12 w-12 rounded-2xl text-base"
                        : "h-10 w-10 rounded-xl text-sm"
                    }`}
                  >
                    🎵
                  </div>
                )}

                <div className="min-w-0">
                  <p
                    className={`truncate font-medium uppercase tracking-[0.18em] text-pink-300 ${
                      storyMusicStyle === "bold" ? "text-[10px]" : "text-[11px]"
                    }`}
                  >
                    Music
                  </p>
                  <p
                    className={`truncate font-semibold text-white ${
                      storyMusicStyle === "bold" ? "text-base" : "text-sm"
                    }`}
                  >
                    {storyMusic.title ?? "Story music"}
                  </p>
                  <p
                    className={`truncate text-zinc-300 ${
                      storyMusicStyle === "bold" ? "text-sm" : "text-xs"
                    }`}
                  >
                    {storyMusic.artist ?? ""}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {story.editorState?.textOverlays?.map((overlay) => (
        <div
          key={overlay.id}
          className="pointer-events-none absolute z-10 max-w-[80%] text-center text-white"
          style={{
            left: `${overlay.x * 100}%`,
            top: `${overlay.y * 100}%`,
            transform: `translate(-50%, -50%) scale(${overlay.scale ?? 1})`,
          }}
        >
          <p
            className={`whitespace-pre-wrap break-words font-medium ${
              overlay.fontSize === "sm"
                ? "text-sm"
                : overlay.fontSize === "lg"
                  ? "text-xl"
                  : "text-base"
            }`}
            style={{
              color: overlay.color ?? "#ffffff",
            }}
          >
            {overlay.text}
          </p>
        </div>
      ))}

      {story.editorState?.overlays?.map((overlay) => (
        <div
          key={overlay.id}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 text-2xl"
          style={{
            left: `${overlay.x * 100}%`,
            top: `${overlay.y * 100}%`,
            transform: `translate(-50%, -50%) scale(${overlay.scale ?? 1}) rotate(${overlay.rotation ?? 0}deg)`,
          }}
        >
          {getStickerSymbol(overlay.preset)}
        </div>
      ))}

      {story.text ? (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 pt-12">
          <p className="whitespace-pre-wrap text-sm leading-6 text-white">
            {story.text}
          </p>
        </div>
      ) : null}
    </>
  )
}
