"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { resolveStorySeenUpdate } from "@/modules/story/policies/story-read-policy"
import type { Story, StoryMusic } from "../types"
import { getStoryPlaybackPolicy } from "@/modules/story/policies/story-playback-policy"
import { resolveNextStoryIndex } from "@/modules/story/policies/story-navigation-policy"
import { StoryViewerDialog } from "./StoryViewerDialog"
import {
  formatStoryDate,
  getStoryCreatorInitial,
} from "./story-viewer-format"
import { useStoryViewerAudio } from "./use-story-viewer-audio"
import { useStoryViewerFixedTimer } from "./use-story-viewer-fixed-timer"

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
  const audioRef = useRef<HTMLAudioElement>(null)
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

  const playbackPolicy = story ? getStoryPlaybackPolicy(story) : null
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

    setCurrentIndex((prev) => prev - 1)
    setProgress(0)
  }

  async function handleNext() {
    if (hasAdvancedRef.current) return
    hasAdvancedRef.current = true

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
  }, [open, story?.id])

  const musicPreviewUrl = story?.editorState?.music?.previewUrl ?? null

  useStoryViewerFixedTimer({
    currentIndex,
    durationMs: fixedDurationMs,
    enabled: Boolean(shouldUseFixedTimer),
    isPaused,
    open,
    progress,
    storyId: story?.id,
    onComplete: () => {
      void handleNext()
    },
    onProgressChange: setProgress,
  })

  useStoryViewerAudio({
    audioRef,
    currentIndex,
    musicPreviewUrl,
    open,
    onAudioErrorChange: setHasAudioError,
  })

  if (!open || !story) {
    return null
  }

  const creatorName =
    story.creator?.displayName ?? story.creator?.username ?? "creator"
  const selectedFilterPreset = story.editorState?.filter?.preset ?? "none"
  const storyMusic = story.editorState?.music ?? null
  const musicStickerX = Math.min(0.78, Math.max(0.22, storyMusic?.x ?? 0.22))
  const musicStickerY = Math.min(0.22, Math.max(0.14, storyMusic?.y ?? 0.12))
  const storyMusicStyle: NonNullable<StoryMusic["style"]> =
    storyMusic?.style ?? "default"

  function handlePressStart() {
    if (story.mediaType === "image" || story.isLocked) {
      setIsPaused(true)
    }
  }

  function handlePressEnd() {
    if (story.mediaType === "image" || story.isLocked) {
      setIsPaused(false)
    }
  }

  return (
    <StoryViewerDialog
      stories={stories}
      story={story}
      currentIndex={currentIndex}
      progress={progress}
      creatorName={creatorName}
      createdAtLabel={formatStoryDate(story.createdAt)}
      creatorInitial={getStoryCreatorInitial(creatorName)}
      selectedFilterPreset={selectedFilterPreset}
      storyMusic={storyMusic}
      storyMusicStyle={storyMusicStyle}
      musicStickerX={musicStickerX}
      musicStickerY={musicStickerY}
      musicPreviewUrl={musicPreviewUrl}
      audioRef={audioRef}
      videoRef={videoRef}
      onClose={() => {
        void handleClose()
      }}
      onTap={(event) => {
        void handleTap(event)
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => {
        void handleTouchEnd()
      }}
      onTouchCancel={handlePressEnd}
      onPressStart={handlePressStart}
      onPressEnd={handlePressEnd}
      onAudioError={() => setHasAudioError(true)}
      onProgressChange={setProgress}
      onVideoEnded={() => {
        void handleNext()
      }}
      onPrev={(event) => {
        event.stopPropagation()
        handlePrev()
      }}
      onNext={(event) => {
        event.stopPropagation()
        void handleNext()
      }}
    />
  )
}
