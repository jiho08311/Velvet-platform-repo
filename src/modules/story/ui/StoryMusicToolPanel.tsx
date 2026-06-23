"use client"

import {
  MUSIC_STYLE_CONTROLS,
  TOOL_HELP_CARD_CLASS,
  TOOL_HELP_CARD_LOOSE_CLASS,
  TOOL_SHEET_ACTION_BUTTON_CLASS,
  TOOL_SHEET_RAISED_PANEL_CLASS,
  getMusicStyleControlClassName,
  type StoryMusicStyle,
} from "./create-story-form-model"
import { StoryMusicArtwork } from "./StoryMusicArtwork"
import type { StoryMusic, StoryMusicSearchItem } from "../types"

type StoryMusicToolPanelProps = {
  selectedMusic: StoryMusic | null | undefined
  selectedMusicStyle: StoryMusicStyle
  isMusicSelected: boolean
  musicQuery: string
  musicResults: StoryMusicSearchItem[]
  isSearchingMusic: boolean
  onMusicQueryChange: (value: string) => void
  onSelectMusic: (option: StoryMusicSearchItem) => void
  onRemoveMusic: () => void
  onChangeMusicStyle: (style: StoryMusicStyle) => void
}

export function StoryMusicToolPanel({
  selectedMusic,
  selectedMusicStyle,
  isMusicSelected,
  musicQuery,
  musicResults,
  isSearchingMusic,
  onMusicQueryChange,
  onSelectMusic,
  onRemoveMusic,
  onChangeMusicStyle,
}: StoryMusicToolPanelProps) {
  return (
    <div className={TOOL_SHEET_RAISED_PANEL_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-black">Music</p>
          <p className="text-xs text-zinc-500">
            Add background music to your story
          </p>
        </div>

        {selectedMusic ? (
          <button
            type="button"
            onClick={onRemoveMusic}
            className={TOOL_SHEET_ACTION_BUTTON_CLASS}
          >
            Remove
          </button>
        ) : null}
      </div>

      <div className="space-y-3">
        <input
          value={musicQuery}
          onChange={(event) => onMusicQueryChange(event.target.value)}
          placeholder="Search music..."
          className="w-full rounded-[20px] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-black outline-none placeholder:text-zinc-400"
        />

        <div className="space-y-2">
          {!musicQuery.trim() ? (
            <div className={TOOL_HELP_CARD_LOOSE_CLASS}>
              Search music to add, then drag it on the preview.
            </div>
          ) : null}

          {isSearchingMusic ? (
            <div className={TOOL_HELP_CARD_CLASS}>Searching...</div>
          ) : null}

          {!isSearchingMusic && musicQuery.trim() && musicResults.length === 0 ? (
            <div className={TOOL_HELP_CARD_CLASS}>No results</div>
          ) : null}

          {!isSearchingMusic
            ? musicResults.map((option) => {
                const isSelected = selectedMusic?.trackId === option.trackId

                return (
                  <button
                    key={option.trackId}
                    type="button"
                    onClick={() => onSelectMusic(option)}
                    className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-zinc-300 bg-white text-black shadow-sm"
                        : "border-zinc-200 bg-zinc-50 text-black hover:bg-zinc-100"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {option.artworkUrl ? (
                        <img
                          src={option.artworkUrl}
                          alt={option.title}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-xs text-zinc-500">
                          🎵
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-black">
                          {option.title}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {option.artist}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-xs font-medium ${
                        isSelected ? "text-black" : "text-zinc-500"
                      }`}
                    >
                      {isSelected ? "Selected" : "Pick"}
                    </span>
                  </button>
                )
              })
            : null}
        </div>

        {selectedMusic ? (
          <div className="rounded-[20px] border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <StoryMusicArtwork
                artworkUrl={selectedMusic?.artworkUrl}
                title={selectedMusic?.title}
                imageClassName="h-10 w-10 rounded-xl object-cover"
                fallbackClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-500"
                fallbackLabel="🎵"
              />

              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-pink-600">
                  Selected
                </p>
                <p className="truncate text-sm font-semibold text-black">
                  {selectedMusic?.title ?? "Selected music"}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {selectedMusic?.artist ?? ""}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {selectedMusic ? (
          <div className={TOOL_HELP_CARD_CLASS}>
            Drag the music sticker directly on the preview.
          </div>
        ) : null}

        {selectedMusic && isMusicSelected ? (
          <div className="rounded-[20px] border border-zinc-200 bg-zinc-50 p-3">
            <p className="mb-2 text-xs font-medium text-zinc-500">
              Sticker style
            </p>

            <div className="flex flex-wrap gap-2">
              {MUSIC_STYLE_CONTROLS.map((control) => {
                const isActive = selectedMusicStyle === control.style

                return (
                  <button
                    key={control.style}
                    type="button"
                    onClick={() => onChangeMusicStyle(control.style)}
                    className={getMusicStyleControlClassName(isActive)}
                  >
                    {control.label}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
