"use client"

import type { Story } from "../types"

type StoryViewerProgressProps = {
  stories: Story[]
  currentIndex: number
  progress: number
}

type StoryViewerHeaderProps = {
  story: Story
  creatorName: string
  createdAtLabel: string
  creatorInitial: string
  onClose: () => void
}

type StoryViewerNavButtonsProps = {
  canGoPrev: boolean
  canGoNext: boolean
  onPrev: (event: React.MouseEvent<HTMLButtonElement>) => void
  onNext: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const STORY_VIEWER_NAV_BUTTON_CLASS =
  "inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-xl leading-none text-white transition hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
const STORY_VIEWER_NAV_SIDE_CLASS =
  "absolute top-1/2 z-20 -translate-y-1/2"

export function StoryViewerProgress({
  stories,
  currentIndex,
  progress,
}: StoryViewerProgressProps) {
  return (
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
  )
}

export function StoryViewerHeader({
  story,
  creatorName,
  createdAtLabel,
  creatorInitial,
  onClose,
}: StoryViewerHeaderProps) {
  return (
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
            {creatorInitial}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {creatorName}
          </p>
          <p className="truncate text-xs text-zinc-300">{createdAtLabel}</p>
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
  )
}

export function StoryViewerNavButtons({
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: StoryViewerNavButtonsProps) {
  return (
    <>
      {canGoPrev ? (
        <button
          type="button"
          onClick={onPrev}
          className={[
            STORY_VIEWER_NAV_SIDE_CLASS,
            "left-3",
            STORY_VIEWER_NAV_BUTTON_CLASS,
          ].join(" ")}
          aria-label="Previous story"
        >
          ‹
        </button>
      ) : null}

      {canGoNext ? (
        <button
          type="button"
          onClick={onNext}
          className={[
            STORY_VIEWER_NAV_SIDE_CLASS,
            "right-3",
            STORY_VIEWER_NAV_BUTTON_CLASS,
          ].join(" ")}
          aria-label="Next story"
        >
          ›
        </button>
      ) : null}
    </>
  )
}
