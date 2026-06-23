"use client"

import type { MutableRefObject } from "react"
import { getFilterStyle, type StoryMusicStyle } from "./create-story-form-model"
import { StoryMusicArtwork } from "./StoryMusicArtwork"
import { StoryMusicSticker } from "./StoryMusicSticker"
import type {
  StoryEditorTool,
  StoryMusic,
  StorySelectedLayer,
  StoryTextOverlay,
} from "../types"

type StoryPreviewSurfaceProps = {
  file: File | null
  previewUrl: string | null
  textOverlays?: StoryTextOverlay[]
  selectedLayer: StorySelectedLayer
  activeTool: StoryEditorTool
  isDragging: boolean
  selectedFilterPreset: string
  selectedMusic: StoryMusic | null | undefined
  selectedMusicStyle: StoryMusicStyle
  isMusicSelected: boolean
  showFilterIndicator: boolean
  filterSwipeOffsetX: number
  filterSwipeStartXRef: MutableRefObject<number | null>
  previewContainerRef: MutableRefObject<HTMLDivElement | null>
  onClearSelectedLayer: () => void
  onOpenFilePicker: () => void
  onRemoveSelectedFile: () => void
  onOpenMusicTool: (event: React.MouseEvent<HTMLButtonElement>) => void
  onFilterSwipeStart: (clientX: number) => void
  onFilterSwipeMove: (clientX: number) => void
  onResetFilterSwipe: () => void
  onSelectedLayerMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void
  onSelectedLayerTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void
  onMusicStickerMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void
  onMusicStickerTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void
}

export function StoryPreviewSurface({
  file,
  previewUrl,
  textOverlays,
  selectedLayer,
  activeTool,
  isDragging,
  selectedFilterPreset,
  selectedMusic,
  selectedMusicStyle,
  isMusicSelected,
  showFilterIndicator,
  filterSwipeOffsetX,
  filterSwipeStartXRef,
  previewContainerRef,
  onClearSelectedLayer,
  onOpenFilePicker,
  onRemoveSelectedFile,
  onOpenMusicTool,
  onFilterSwipeStart,
  onFilterSwipeMove,
  onResetFilterSwipe,
  onSelectedLayerMouseDown,
  onSelectedLayerTouchStart,
  onMusicStickerMouseDown,
  onMusicStickerTouchStart,
}: StoryPreviewSurfaceProps) {
  return (
    <div
      ref={(element) => {
        previewContainerRef.current = element
      }}
      onClick={onClearSelectedLayer}
      onTouchStart={(event) => {
        if (activeTool === "filter") {
          onFilterSwipeStart(event.touches[0]?.clientX ?? 0)
        }
      }}
      onTouchMove={(event) => {
        if (activeTool === "filter") {
          onFilterSwipeMove(event.touches[0]?.clientX ?? 0)
        }
      }}
      onTouchEnd={onResetFilterSwipe}
      onTouchCancel={onResetFilterSwipe}
      onMouseDown={(event) => {
        if (activeTool === "filter") {
          onFilterSwipeStart(event.clientX)
        }
      }}
      onMouseMove={(event) => {
        if (activeTool === "filter" && (event.buttons & 1) === 1) {
          onFilterSwipeMove(event.clientX)
        }
      }}
      onMouseUp={onResetFilterSwipe}
      className="relative w-full aspect-[9/16] overflow-hidden bg-white"
    >
      {previewUrl ? (
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
          {file?.type.startsWith("video/") ? (
            <video
              src={previewUrl}
              className="absolute inset-0 h-full w-full object-contain"
              style={getFilterStyle(selectedFilterPreset)}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={previewUrl}
              className="absolute inset-0 h-full w-full object-contain"
              style={getFilterStyle(selectedFilterPreset)}
              alt="Story preview"
            />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <button
            type="button"
            onClick={onOpenFilePicker}
            className="flex flex-col items-center justify-center gap-4 text-center transition active:scale-[0.96]"
          >
            <p className="text-base font-semibold text-zinc-900">
              Start your story
            </p>

            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Upload a photo or video to begin editing.
            </p>
          </button>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 md:inset-[6%] md:rounded-[22px] md:border md:border-zinc-200" />

      {previewUrl ? (
        <button
          type="button"
          onClick={onRemoveSelectedFile}
          className="absolute right-2 top-2 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-lg text-white backdrop-blur-sm transition hover:bg-black/75"
          aria-label="Remove selected file"
        >
          ×
        </button>
      ) : null}

      {previewUrl && activeTool === "filter" && showFilterIndicator ? (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full border border-zinc-200 bg-white/90 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-black backdrop-blur-sm">
          {selectedFilterPreset}
        </div>
      ) : null}

      {previewUrl && activeTool === "filter" && !showFilterIndicator ? (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[11px] text-zinc-500 opacity-80">
          Swipe
        </div>
      ) : null}

      {textOverlays?.map((overlay) => {
        const isSelected =
          selectedLayer?.type === "text" && selectedLayer.id === overlay.id

        return (
          <div
            key={overlay.id}
            data-overlay-id={overlay.id}
            onMouseDown={onSelectedLayerMouseDown}
            onTouchStart={onSelectedLayerTouchStart}
            className={`absolute max-w-[80%] rounded-md text-center text-white transition-all duration-150 ${
              activeTool === "text" ? "pointer-events-auto" : "pointer-events-none"
            } ${
              isSelected
                ? isDragging
                  ? "z-20 ring-2 ring-pink-400 shadow-2xl"
                  : "ring-2 ring-pink-400 shadow-lg"
                : "opacity-80"
            }`}
            style={{
              left: `${overlay.x * 100}%`,
              top: `${overlay.y * 100}%`,
              touchAction: "none",
              transform: `translate(-50%, -50%) scale(${overlay.scale ?? 1})`,
              transition: isDragging ? "none" : "transform 120ms ease-out",
              willChange: "transform",
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
              style={{ color: overlay.color ?? "#ffffff" }}
            >
              {overlay.text || "Text overlay"}
            </p>
          </div>
        )
      })}

      {previewUrl ? (
        <>
          <div className="absolute left-5 right-5 top-3 z-20">
            <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white/88 px-3 py-2.5 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
              <StoryMusicArtwork
                artworkUrl={selectedMusic?.artworkUrl}
                title={selectedMusic?.title}
                imageClassName="h-10 w-10 rounded-xl object-cover"
                fallbackClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-sm text-black"
                fallbackLabel="♪"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-black">
                  {selectedMusic?.title ?? "음악 추가"}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {selectedMusic?.artist ?? "탭해서 음악 선택"}
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenMusicTool}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xl leading-none text-black"
              >
                +
              </button>
            </div>
          </div>

          {selectedMusic ? (
            <StoryMusicSticker
              selectedMusic={selectedMusic}
              selectedMusicStyle={selectedMusicStyle}
              activeTool={activeTool}
              isDragging={isDragging}
              isMusicSelected={isMusicSelected}
              onMouseDown={onMusicStickerMouseDown}
              onTouchStart={onMusicStickerTouchStart}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
