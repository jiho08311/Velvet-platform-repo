"use client"

import type { StoryMusicStyle } from "./create-story-form-model"
import { StoryMusicArtwork } from "./StoryMusicArtwork"
import type { StoryEditorTool, StoryMusic } from "../types"

type StoryMusicStickerProps = {
  selectedMusic: StoryMusic
  selectedMusicStyle: StoryMusicStyle
  activeTool: StoryEditorTool
  isDragging: boolean
  isMusicSelected: boolean
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void
  onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void
}

export function StoryMusicSticker({
  selectedMusic,
  selectedMusicStyle,
  activeTool,
  isDragging,
  isMusicSelected,
  onMouseDown,
  onTouchStart,
}: StoryMusicStickerProps) {
  return (
    <div
      className={`absolute z-10 max-w-[78%] -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
        activeTool === "music"
          ? "pointer-events-auto cursor-grab active:cursor-grabbing"
          : "pointer-events-none"
      } ${isDragging ? "scale-[1.08]" : "scale-100"} ${
        isMusicSelected ? "rounded-2xl ring-2 ring-pink-400 shadow-xl" : "opacity-90"
      }`}
      style={{
        left: `${(selectedMusic.x ?? 0.22) * 100}%`,
        top: `${(selectedMusic.y ?? 0.12) * 100}%`,
        touchAction: "none",
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <div
        className={`pointer-events-none border border-zinc-200 bg-white/88 backdrop-blur-sm ${
          selectedMusicStyle === "minimal"
            ? "rounded-full px-3 py-1.5"
            : selectedMusicStyle === "bold"
              ? "rounded-3xl px-4 py-3 shadow-2xl"
              : "rounded-2xl px-3 py-2 shadow-lg"
        }`}
      >
        {selectedMusicStyle === "minimal" ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-black">🎵</span>
            <p className="max-w-[160px] truncate text-xs font-medium text-black">
              {selectedMusic.title ?? "Selected music"}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <StoryMusicArtwork
              artworkUrl={selectedMusic.artworkUrl}
              title={selectedMusic.title}
              imageClassName={`object-cover ${
                selectedMusicStyle === "bold"
                  ? "h-12 w-12 rounded-2xl"
                  : "h-10 w-10 rounded-xl"
              }`}
              fallbackClassName={`flex items-center justify-center bg-zinc-100 text-black ${
                selectedMusicStyle === "bold"
                  ? "h-12 w-12 rounded-2xl text-base"
                  : "h-10 w-10 rounded-xl text-sm"
              }`}
              fallbackLabel="🎵"
            />

            <div className="min-w-0">
              <p
                className={`truncate font-medium uppercase tracking-[0.18em] text-pink-600 ${
                  selectedMusicStyle === "bold" ? "text-[10px]" : "text-[11px]"
                }`}
              >
                Music
              </p>
              <p
                className={`truncate font-semibold text-black ${
                  selectedMusicStyle === "bold" ? "text-base" : "text-sm"
                }`}
              >
                {selectedMusic.title ?? "Selected music"}
              </p>
              <p
                className={`truncate text-zinc-500 ${
                  selectedMusicStyle === "bold" ? "text-sm" : "text-xs"
                }`}
              >
                {selectedMusic.artist ?? ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
