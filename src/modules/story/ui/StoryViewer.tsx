"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { Story } from "../types"

type StoryViewerProps = {
  stories: Story[]
  initialIndex: number
  open: boolean
  onClose: () => void
  onSeenStories?: (input: {
    creatorId: string
    storyId: string
  }) => Promise<void> | void
}

const IMAGE_STORY_DURATION_MS = 10000

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

  const touchStartXRef = useRef<number | null>(null)
  const touchEndXRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastMarkedStoryIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex)
      setProgress(0)
      setIsPaused(false)
      lastMarkedStoryIdRef.current = null
    }
  }, [initialIndex, open])

  const story = stories[currentIndex] ?? null

  const isFirst = currentIndex === 0
  const isLast = currentIndex === stories.length - 1
  const shouldUseFixedTimer =
    !!story && (story.mediaType === "image" || story.isLocked)

  const markSeen = useCallback(async () => {
    if (!story) return
    if (lastMarkedStoryIdRef.current === story.id) return

    lastMarkedStoryIdRef.current = story.id

    await onSeenStories?.({
      creatorId: story.creatorId,
      storyId: story.id,
    })
  }, [onSeenStories, story])

  function handlePrev() {
    if (isFirst) return
    setCurrentIndex((prev) => prev - 1)
    setProgress(0)
  }

  async function handleNext() {
    await markSeen()

    if (isLast) {
      onClose()
      return
    }

    setCurrentIndex((prev) => prev + 1)
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
    if (!shouldUseFixedTimer) return
    if (isPaused) return

    const startedAt = Date.now() - (progress / 100) * IMAGE_STORY_DURATION_MS

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextProgress = Math.min(
        100,
        (elapsed / IMAGE_STORY_DURATION_MS) * 100
      )

      setProgress(nextProgress)

      if (nextProgress >= 100) {
        window.clearInterval(timer)

        void handleNext()
      }
    }, 50)

    return () => window.clearInterval(timer)
  }, [
    currentIndex,
    handleNext,
    isPaused,
    open,
    progress,
    shouldUseFixedTimer,
    story,
  ])

  if (!open || !story) {
    return null
  }

  const creatorName =
    story.creator?.displayName ?? story.creator?.username ?? "creator"

  return (
    <div className="fixed inset-0 z-[100] bg-black/90" onClick={onClose}>
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
              onClick={onClose}
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
                    className="h-full w-full object-cover"
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
                    className="h-full w-full object-cover"
                  />
                )}

                {story.text ? (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 pt-12">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-white">
                      {story.text}
                    </p>
                  </div>
                ) : null}
              </>
            )}

            {!isFirst ? (
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

            {!isLast ? (
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