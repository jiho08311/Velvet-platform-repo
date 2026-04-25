"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { resolveStorySeenUpdate } from "../lib/story-read-policy"
import type { Story } from "../types"
import { getStoryPlaybackPolicy } from "../lib/story-playback-policy"
import { resolveNextStoryIndex } from "../lib/story-navigation-policy"

type StoryViewerProps = {
  stories: Story[]
  initialIndex: number
  open: boolean
  onClose: () => void
  onSeenStories?: (input: {
    creatorId: string
    storyId: string
  }) => Promise<
    | {
        ok: true
        persistedStoryId: string
      }
    | {
        ok: false
      }
  > | void
}



function formatStoryDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function getInitial(value?: string | null) {
  const normalized = value?.trim() ?? ""
  if (!normalized) return "C"
  return normalized.slice(0, 1).toUpperCase()
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

export function StoryViewer({
  stories,
  initialIndex,
  open,
  onClose,
  onSeenStories,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [hasAudioError, setHasAudioError] = useState(false)

  const touchStartXRef = useRef<number | null>(null)
  const touchEndXRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastMarkedStoryIdRef = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
    const timerRef = useRef<number | null>(null)
  const timerStartedAtRef = useRef<number | null>(null)

const hasAdvancedRef = useRef(false)

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex)
      setProgress(0)
      setIsPaused(false)
      setHasAudioError(false)
      lastMarkedStoryIdRef.current = null
    }
  }, [initialIndex, open])

  const story = stories[currentIndex] ?? null

  const playbackPolicy = story
  ? getStoryPlaybackPolicy(story)
  : null

const shouldUseFixedTimer = playbackPolicy?.mode === "fixed"
const fixedDurationMs = playbackPolicy?.durationMs ?? 10000


 

  const markSeen = useCallback(
    async (trigger: "advance" | "close") => {
    if (!story) return

    const resolution = resolveStorySeenUpdate({
      creatorId: story.creatorId,
      storyId: story.id,
      lastMarkedStoryId: lastMarkedStoryIdRef.current,
      trigger,
    })

    if (!resolution.shouldMarkSeen) {
      return
    }

    const result = await onSeenStories?.({
      creatorId: story.creatorId,
      storyId: story.id,
    })

    if (result && !result.ok) {
      return
    }

    lastMarkedStoryIdRef.current = result?.persistedStoryId ?? story.id
    },
    [onSeenStories, story]
  )

  const handleClose = useCallback(async () => {
    await markSeen("close")
    onClose()
  }, [markSeen, onClose])

function handlePrev() {
  if (currentIndex === 0) return

  if (timerRef.current) {
    window.clearInterval(timerRef.current)
    timerRef.current = null
  }

  timerStartedAtRef.current = null

  setCurrentIndex((prev) => prev - 1)
  setProgress(0)
}

async function handleNext() {
  if (hasAdvancedRef.current) return
  hasAdvancedRef.current = true

  if (timerRef.current) {
    window.clearInterval(timerRef.current)
    timerRef.current = null
  }

  timerStartedAtRef.current = null

  await markSeen("advance")

  const resolution = resolveNextStoryIndex(stories, currentIndex)

  if (resolution.shouldClose) {
    onClose()
    return
  }

  setCurrentIndex(resolution.nextIndex!)
  setProgress(0)
}

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.touches[0]?.clientX ?? null
    touchEndXRef.current = null
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    touchEndXRef.current = event.touches[0]?.clientX ?? null
  }

  async function handleTouchEnd() {
    const startX = touchStartXRef.current
    const endX = touchEndXRef.current

    if (startX === null || endX === null) {
      return
    }

    const diffX = startX - endX
    const threshold = 50

    if (diffX > threshold) {
      await handleNext()
    }

    if (diffX < -threshold) {
      handlePrev()
    }

    touchStartXRef.current = null
    touchEndXRef.current = null
  }

  async function handleTap(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const width = rect.width

    if (x < width / 2) {
      handlePrev()
    } else {
      await handleNext()
    }
  }

  useEffect(() => {
    if (!open || !story) return

    hasAdvancedRef.current = false

    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    timerStartedAtRef.current = null
    setProgress(0)
  }, [open, story?.id])
  const musicPreviewUrl = story?.editorState?.music?.previewUrl ?? null





    useEffect(() => {
    if (!open || !story) return
    if (!shouldUseFixedTimer) return

    if (isPaused) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (timerStartedAtRef.current === null) {
 timerStartedAtRef.current =
  Date.now() - (progress / 100) * fixedDurationMs
    }

    timerRef.current = window.setInterval(() => {
      if (timerStartedAtRef.current === null) return

      const elapsed = Date.now() - timerStartedAtRef.current
      const nextProgress = Math.min(
        100,
   (elapsed / fixedDurationMs) * 100
      )

      setProgress(nextProgress)

      if (nextProgress >= 100) {
        if (timerRef.current) {
          window.clearInterval(timerRef.current)
          timerRef.current = null
        }

        timerStartedAtRef.current = null
        void handleNext()
      }
    }, 50)

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [currentIndex, handleNext, isPaused, open, shouldUseFixedTimer, story])


  

  useEffect(() => {
    setHasAudioError(false)
  }, [currentIndex, musicPreviewUrl, open])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) return

    if (!open || !musicPreviewUrl) {
      audio.pause()
      audio.currentTime = 0
      setHasAudioError(false)
      return
    }

    setHasAudioError(false)
    audio.currentTime = 0

    void audio.play().catch(() => {
      setHasAudioError(true)
    })

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [currentIndex, musicPreviewUrl, open])

  if (!open || !story) {
    return null
  }

  const creatorName =
    story.creator?.displayName ?? story.creator?.username ?? "creator"
  const selectedFilterPreset = story.editorState?.filter?.preset ?? "none"
  const storyMusic = story.editorState?.music ?? null
  const musicStickerX = Math.min(0.78, Math.max(0.22, storyMusic?.x ?? 0.22))
  const musicStickerY = Math.min(0.22, Math.max(0.14, storyMusic?.y ?? 0.12))
const storyMusicStyle = storyMusic?.style ?? "default"
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90"
      onClick={() => {
        void handleClose()
      }}
    >
      <div className="flex h-full w-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-black"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-3">
            {stories.map((_, index) => (
              <div
                key={index}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
              >
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-100 linear"
                  style={{
                    width:
                      index < currentIndex
                        ? "100%"
                        : index === currentIndex
                          ? `${progress}%`
                          : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4 pt-6">
            <div className="flex min-w-0 items-center gap-3">
              {story.creator?.avatarUrl ? (
                <img
                  src={story.creator.avatarUrl}
                  alt={creatorName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
                  {getInitial(creatorName)}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {creatorName}
                </p>
                <p className="truncate text-xs text-zinc-300">
                  {formatStoryDate(story.createdAt)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                void handleClose()
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-lg text-white transition hover:bg-black/70"
              aria-label="Close story"
            >
              ×
            </button>
          </div>

          <div
            className="relative aspect-[9/16] w-full bg-zinc-950"
            onClick={(event) => {
              void handleTap(event)
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => {
              void handleTouchEnd()
            }}
            onMouseDown={() => {
              if (story.mediaType === "image" || story.isLocked) {
                setIsPaused(true)
              }
            }}
            onMouseUp={() => {
              if (story.mediaType === "image" || story.isLocked) {
                setIsPaused(false)
              }
            }}
            onMouseLeave={() => {
              if (story.mediaType === "image" || story.isLocked) {
                setIsPaused(false)
              }
            }}
            onTouchCancel={() => {
              if (story.mediaType === "image" || story.isLocked) {
                setIsPaused(false)
              }
            }}
          >
            {musicPreviewUrl ? (
              <audio
                ref={audioRef}
                src={musicPreviewUrl}
                preload="none"
                onError={() => setHasAudioError(true)}
              />
            ) : null}

            {story.isLocked ? (
              <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
                <div className="max-w-xs">
                  <p className="text-lg font-semibold text-white">
                    구독자 전용 스토리
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    이 스토리는 구독자만 볼 수 있습니다.
                  </p>
                </div>
              </div>
            ) : (
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
                        setProgress(0)
                        return
                      }

                      setProgress(
                        Math.min(100, (video.currentTime / duration) * 100)
                      )
                    }}
                    onTimeUpdate={(event) => {
                      const video = event.currentTarget
                      const duration = video.duration

                      if (!Number.isFinite(duration) || duration <= 0) {
                        setProgress(0)
                        return
                      }

                      setProgress(
                        Math.min(100, (video.currentTime / duration) * 100)
                      )
                    }}
                    onEnded={() => {
                      void handleNext()
                    }}
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
            )}

      {currentIndex > 0 ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  handlePrev()
                }}
                className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white"
                aria-label="Previous story"
              >
                ‹
              </button>
            ) : null}

        {currentIndex < stories.length - 1 ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  void handleNext()
                }}
                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white"
                aria-label="Next story"
              >
                ›
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
