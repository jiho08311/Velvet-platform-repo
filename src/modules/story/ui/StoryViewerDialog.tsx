"use client"

import type { MouseEvent, MutableRefObject, RefObject, TouchEvent } from "react"
import type { Story, StoryMusic } from "../types"
import {
  StoryViewerHeader,
  StoryViewerNavButtons,
  StoryViewerProgress,
} from "./StoryViewerChrome"
import { StoryViewerMediaFrame } from "./StoryViewerMediaFrame"

type StoryViewerDialogProps = {
  stories: Story[]
  story: Story
  currentIndex: number
  progress: number
  creatorName: string
  createdAtLabel: string
  creatorInitial: string
  selectedFilterPreset: string
  storyMusic: StoryMusic | null
  storyMusicStyle: NonNullable<StoryMusic["style"]>
  musicStickerX: number
  musicStickerY: number
  musicPreviewUrl: string | null
  audioRef: RefObject<HTMLAudioElement>
  videoRef: MutableRefObject<HTMLVideoElement | null>
  onClose: () => void
  onTap: (event: MouseEvent<HTMLDivElement>) => void
  onTouchStart: (event: TouchEvent<HTMLDivElement>) => void
  onTouchMove: (event: TouchEvent<HTMLDivElement>) => void
  onTouchEnd: () => void
  onTouchCancel: () => void
  onPressStart: () => void
  onPressEnd: () => void
  onAudioError: () => void
  onProgressChange: (progress: number) => void
  onVideoEnded: () => void
  onPrev: (event: MouseEvent<HTMLButtonElement>) => void
  onNext: (event: MouseEvent<HTMLButtonElement>) => void
}

export function StoryViewerDialog({
  stories,
  story,
  currentIndex,
  progress,
  creatorName,
  createdAtLabel,
  creatorInitial,
  selectedFilterPreset,
  storyMusic,
  storyMusicStyle,
  musicStickerX,
  musicStickerY,
  musicPreviewUrl,
  audioRef,
  videoRef,
  onClose,
  onTap,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  onPressStart,
  onPressEnd,
  onAudioError,
  onProgressChange,
  onVideoEnded,
  onPrev,
  onNext,
}: StoryViewerDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90"
      onClick={onClose}
    >
      <div className="flex h-full w-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-black"
          onClick={(event) => event.stopPropagation()}
        >
          <StoryViewerProgress
            stories={stories}
            currentIndex={currentIndex}
            progress={progress}
          />

          <StoryViewerHeader
            story={story}
            creatorName={creatorName}
            createdAtLabel={createdAtLabel}
            creatorInitial={creatorInitial}
            onClose={onClose}
          />

          <div
            className="relative aspect-[9/16] w-full bg-zinc-950"
            onClick={onTap}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onPressStart}
            onMouseUp={onPressEnd}
            onMouseLeave={onPressEnd}
            onTouchCancel={onTouchCancel}
          >
            {musicPreviewUrl ? (
              <audio
                ref={audioRef}
                src={musicPreviewUrl}
                preload="none"
                onError={onAudioError}
              />
            ) : null}

            <StoryViewerMediaFrame
              story={story}
              storyMusic={storyMusic}
              storyMusicStyle={storyMusicStyle}
              selectedFilterPreset={selectedFilterPreset}
              musicStickerX={musicStickerX}
              musicStickerY={musicStickerY}
              videoRef={videoRef}
              onProgressChange={onProgressChange}
              onVideoEnded={onVideoEnded}
            />

            <StoryViewerNavButtons
              canGoPrev={currentIndex > 0}
              canGoNext={currentIndex < stories.length - 1}
              onPrev={onPrev}
              onNext={onNext}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
