"use client"

import type { MutableRefObject } from "react"
import type { PostVisibility } from "@/modules/post/types"
import { Button } from "@/shared/ui/Button"
import {
  getAcceptedPostMediaFiles,
  type PublishMode,
} from "./create-post-form-model"
import {
  getComposerControlButtonClassName,
  getComposerControlClassName,
} from "./post-composer-ui-state"

type PostComposerSubmitBarProps = {
  visibility: PostVisibility
  onVisibilityChange: (visibility: PostVisibility) => void
  visibilityOptions: PostVisibility[]
  showPublishMode: boolean
  publishMode: PublishMode
  onPublishModeChange: (publishMode: PublishMode) => void
  publishedAt: string
  onPublishedAtChange: (publishedAt: string) => void
  fileInputRef: MutableRefObject<HTMLInputElement | null>
  carouselFileInputRef: MutableRefObject<HTMLInputElement | null>
  pendingCarouselBlockIdRef: MutableRefObject<string | null>
  onAddTextBlock: () => void
  onAddMediaBlocks: (files: File[]) => void
  onAddCarouselItems: (blockId: string, files: File[]) => void
  submitCTA: {
    label: string
    disabled: boolean
  }
}

export function PostComposerSubmitBar({
  visibility,
  onVisibilityChange,
  visibilityOptions,
  showPublishMode,
  publishMode,
  onPublishModeChange,
  publishedAt,
  onPublishedAtChange,
  fileInputRef,
  carouselFileInputRef,
  pendingCarouselBlockIdRef,
  onAddTextBlock,
  onAddMediaBlocks,
  onAddCarouselItems,
  submitCTA,
}: PostComposerSubmitBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-zinc-800/80 bg-zinc-950/50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={visibility}
          onChange={(event) =>
            onVisibilityChange(event.target.value as PostVisibility)
          }
          className={getComposerControlClassName()}
        >
          {visibilityOptions.map((option) => (
            <option key={option} value={option}>
              {option === "public"
                ? "Public"
                : option === "subscribers"
                  ? "Subscribers"
                  : "Paid"}
            </option>
          ))}
        </select>

        {showPublishMode ? (
          <>
            <select
              value={publishMode}
              onChange={(event) =>
                onPublishModeChange(event.target.value as PublishMode)
              }
              className={getComposerControlClassName()}
            >
              <option value="now">Publish now</option>
              <option value="scheduled">Schedule</option>
            </select>

            {publishMode === "scheduled" ? (
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(event) => onPublishedAtChange(event.target.value)}
                className={getComposerControlClassName()}
              />
            ) : null}
          </>
        ) : null}

        <input
          ref={(element) => {
            fileInputRef.current = element
          }}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(event) =>
            onAddMediaBlocks(getAcceptedPostMediaFiles(event.target.files))
          }
          className="hidden"
        />

        <input
          ref={(element) => {
            carouselFileInputRef.current = element
          }}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(event) => {
            const blockId = pendingCarouselBlockIdRef.current
            const nextFiles = getAcceptedPostMediaFiles(event.target.files)

            if (blockId) {
              onAddCarouselItems(blockId, nextFiles)
            }

            pendingCarouselBlockIdRef.current = null
          }}
          className="hidden"
        />

        <button
          type="button"
          onClick={onAddTextBlock}
          className={getComposerControlButtonClassName()}
        >
          Text
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-pink-500/30 bg-pink-500/10 text-lg text-pink-300 transition hover:bg-pink-500/20"
          aria-label="Upload files"
          title="Upload files"
        >
          +
        </button>
      </div>

      <Button
        type="submit"
        disabled={submitCTA.disabled}
        className="min-h-[48px] bg-pink-600 px-6 hover:bg-pink-500"
      >
        {submitCTA.label}
      </Button>
    </div>
  )
}
