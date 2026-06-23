"use client"

import type { MutableRefObject } from "react"
import {
  getFilterStyle,
  type EditorMediaBlock,
  type PostFilterPreset,
} from "./create-post-form-model"
import { PostImageBlockControls } from "./PostImageBlockControls"
import { PostVideoBlockControls } from "./PostVideoBlockControls"

type ActiveMediaTool = "text" | "filter" | "trim" | null

type PostMediaBlockEditorProps = {
  block: EditorMediaBlock
  previewContainerRef: MutableRefObject<HTMLDivElement | null>
  filterSwipeStartXRef: MutableRefObject<number | null>
  filterSwipeOffsetX: number
  showFilterIndicator: boolean
  activeMediaTool: ActiveMediaTool
  onRemove: () => void
  onSetActiveMediaTool: (tool: ActiveMediaTool) => void
  onEnableImageOverlayText: () => void
  onUpdateImageOverlayText: (text: string) => void
  onUpdateImageOverlayColor: (color: string) => void
  onFilterSwipeStart: (clientX: number) => void
  onFilterSwipeMove: (
    clientX: number,
    blockId: string,
    currentPreset: PostFilterPreset
  ) => void
  onResetFilterSwipe: () => void
  onOverlayMouseDown: (
    event: React.MouseEvent<HTMLDivElement>,
    blockId: string
  ) => void
  onOverlayWheel: (
    event: React.WheelEvent<HTMLDivElement>,
    blockId: string
  ) => void
  onOverlayTouchStart: (
    event: React.TouchEvent<HTMLDivElement>,
    blockId: string
  ) => void
  onAddCarouselItems: () => void
  onUpdateVideoMuted: (muted: boolean) => void
  onVideoTrimChange: (nextTrim: {
    duration: number
    requiresTrim: boolean
    startTime: number
  }) => void
}

export function PostMediaBlockEditor({
  block,
  previewContainerRef,
  filterSwipeStartXRef,
  filterSwipeOffsetX,
  showFilterIndicator,
  activeMediaTool,
  onRemove,
  onSetActiveMediaTool,
  onEnableImageOverlayText,
  onUpdateImageOverlayText,
  onUpdateImageOverlayColor,
  onFilterSwipeStart,
  onFilterSwipeMove,
  onResetFilterSwipe,
  onOverlayMouseDown,
  onOverlayWheel,
  onOverlayTouchStart,
  onAddCarouselItems,
  onUpdateVideoMuted,
  onVideoTrimChange,
}: PostMediaBlockEditorProps) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-3 top-3 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 group-hover:flex"
      >
        ✕
      </button>

      <div
        ref={(element) => {
          if (block.type === "image") {
            previewContainerRef.current = element
          }
        }}
        onTouchStart={(event) => {
          if (block.type !== "image") return
          if (activeMediaTool !== "filter") return

          onFilterSwipeStart(event.touches[0]?.clientX ?? 0)
        }}
        onTouchMove={(event) => {
          if (block.type !== "image") return
          if (activeMediaTool !== "filter") return

          onFilterSwipeMove(
            event.touches[0]?.clientX ?? 0,
            block.id,
            (block.editorState?.image?.filter ?? "none") as PostFilterPreset
          )
        }}
        onTouchEnd={() => {
          if (block.type !== "image") return
          if (activeMediaTool !== "filter") return

          onResetFilterSwipe()
        }}
        onTouchCancel={() => {
          if (block.type !== "image") return
          if (activeMediaTool !== "filter") return

          onResetFilterSwipe()
        }}
        onMouseDown={(event) => {
          if (block.type !== "image") return
          if (activeMediaTool !== "filter") return

          onFilterSwipeStart(event.clientX)
        }}
        onMouseMove={(event) => {
          if (block.type !== "image") return
          if (activeMediaTool !== "filter") return
          if ((event.buttons & 1) !== 1) return

          onFilterSwipeMove(
            event.clientX,
            block.id,
            (block.editorState?.image?.filter ?? "none") as PostFilterPreset
          )
        }}
        onMouseUp={() => {
          if (block.type !== "image") return
          if (activeMediaTool !== "filter") return

          onResetFilterSwipe()
        }}
        className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-950"
      >
        {block.type === "video" ? (
          <video
            src={block.previewUrl}
            autoPlay
            loop
            playsInline
            muted={block.editorState?.video?.muted ?? true}
            preload="metadata"
            onLoadedMetadata={(event) => {
              const trimStart = block.editorState?.video?.trimStart ?? 0
              if (trimStart > 0) {
                event.currentTarget.currentTime = trimStart
              }
            }}
            onTimeUpdate={(event) => {
              const video = event.currentTarget
              const trimStart = block.editorState?.video?.trimStart ?? 0
              const trimEnd = block.editorState?.video?.trimEnd ?? null

              if (trimStart > 0 && video.currentTime < trimStart) {
                video.currentTime = trimStart
              }

              if (
                trimEnd !== null &&
                trimEnd > trimStart &&
                video.currentTime >= trimEnd
              ) {
                video.currentTime = trimStart
                void video.play()
              }
            }}
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{
                transform: `translateX(${filterSwipeOffsetX}px)`,
                transition:
                  filterSwipeStartXRef.current === null
                    ? "transform 180ms ease-out"
                    : "none",
                willChange: "transform",
              }}
            >
              <img
                src={block.previewUrl}
                alt="Selected media"
                style={getFilterStyle(block.editorState?.image?.filter)}
                className="h-full w-full object-cover"
              />
            </div>

            {block.editorState?.image?.overlayText?.text ? (
              <div
                onMouseDown={(event) => {
                  if (activeMediaTool !== "text") return
                  onOverlayMouseDown(event, block.id)
                }}
                onWheel={(event) => {
                  if (activeMediaTool !== "text") return
                  onOverlayWheel(event, block.id)
                }}
                onTouchStart={(event) => {
                  if (activeMediaTool !== "text") return
                  onOverlayTouchStart(event, block.id)
                }}
                className={`absolute z-10 max-w-[80%] select-none text-center ${
                  activeMediaTool === "text"
                    ? "cursor-grab active:cursor-grabbing"
                    : "pointer-events-none"
                }`}
                style={{
                  left: `${block.editorState.image.overlayText.x * 100}%`,
                  top: `${block.editorState.image.overlayText.y * 100}%`,
                  transform: `translate(-50%, -50%) scale(${block.editorState.image.overlayText.scale ?? 1})`,
                  touchAction: "none",
                }}
              >
                <p
                  className="whitespace-pre-wrap text-base font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]"
                  style={{
                    color: block.editorState.image.overlayText.color,
                  }}
                >
                  {block.editorState.image.overlayText.text}
                </p>
              </div>
            ) : null}

            {activeMediaTool === "filter" && showFilterIndicator ? (
              <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-zinc-200 bg-white/90 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-black backdrop-blur-sm">
                {block.editorState?.image?.filter ?? "none"}
              </div>
            ) : null}

            {activeMediaTool === "filter" && !showFilterIndicator ? (
              <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-[11px] text-zinc-400 opacity-80">
                Swipe
              </div>
            ) : null}
          </>
        )}
      </div>

      {block.type === "image" ? (
        <PostImageBlockControls
          block={block}
          activeMediaTool={activeMediaTool}
          onSetActiveMediaTool={onSetActiveMediaTool}
          onEnableImageOverlayText={onEnableImageOverlayText}
          onUpdateImageOverlayText={onUpdateImageOverlayText}
          onUpdateImageOverlayColor={onUpdateImageOverlayColor}
          onAddCarouselItems={onAddCarouselItems}
        />
      ) : null}

      {block.type === "video" ? (
        <PostVideoBlockControls
          block={block}
          activeMediaTool={activeMediaTool}
          onSetActiveMediaTool={onSetActiveMediaTool}
          onAddCarouselItems={onAddCarouselItems}
          onUpdateVideoMuted={onUpdateVideoMuted}
          onVideoTrimChange={onVideoTrimChange}
        />
      ) : null}
    </div>
  )
}
