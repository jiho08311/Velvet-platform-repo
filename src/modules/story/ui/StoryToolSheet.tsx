"use client"

import { StoryVideoTrimField } from "@/modules/media/public/story-video-trim-field-ui"
import {
  TOOL_HELP_CARD_CLASS,
  TOOL_SHEET_ACTION_BUTTON_CLASS,
  TOOL_SHEET_COMPACT_PANEL_CLASS,
  TOOL_SHEET_TRIM_PANEL_CLASS,
  type StoryMusicStyle,
} from "./create-story-form-model"
import { StoryMusicToolPanel } from "./StoryMusicToolPanel"
import { StoryTextToolPanel } from "./StoryTextToolPanel"
import type {
  StoryEditorTool,
  StoryMusic,
  StoryMusicSearchItem,
  StoryTextOverlay,
  StoryVideoTrim,
} from "../types"

type StoryToolSheetProps = {
  activeTool: StoryEditorTool
  file: File | null
  selectedTextOverlay: StoryTextOverlay | null
  selectedMusic: StoryMusic | null | undefined
  selectedMusicStyle: StoryMusicStyle
  isMusicSelected: boolean
  musicQuery: string
  musicResults: StoryMusicSearchItem[]
  isSearchingMusic: boolean
  onClose: () => void
  onAddTextOverlay: () => void
  onRemoveTextOverlay: () => void
  onOverlayTextChange: (value: string) => void
  onTextOverlayColorChange: (color: string) => void
  onMusicQueryChange: (value: string) => void
  onSelectMusic: (option: StoryMusicSearchItem) => void
  onRemoveMusic: () => void
  onChangeMusicStyle: (style: StoryMusicStyle) => void
  onTrimChange: (trim: StoryVideoTrim) => void
}

function getToolSheetTitle(activeTool: StoryToolSheetProps["activeTool"]) {
  if (activeTool === "text") return "Text"
  if (activeTool === "music") return "Music"
  if (activeTool === "filter") return "Filter"
  return "Trim"
}

export function StoryToolSheet({
  activeTool,
  file,
  selectedTextOverlay,
  selectedMusic,
  selectedMusicStyle,
  isMusicSelected,
  musicQuery,
  musicResults,
  isSearchingMusic,
  onClose,
  onAddTextOverlay,
  onRemoveTextOverlay,
  onOverlayTextChange,
  onTextOverlayColorChange,
  onMusicQueryChange,
  onSelectMusic,
  onRemoveMusic,
  onChangeMusicStyle,
  onTrimChange,
}: StoryToolSheetProps) {
  const isTextToolOpen = activeTool === "text"
  const isMusicToolOpen = activeTool === "music"
  const isFilterToolOpen = activeTool === "filter"
  const isTrimToolOpen = activeTool === "trim"

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-2xl rounded-t-[32px] border border-zinc-200 bg-white/98 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 pb-3 pt-3">
          <div className="mx-auto h-1.5 w-14 rounded-full bg-zinc-300" />
        </div>

        <div className="flex items-center justify-between px-5 pb-3">
          <p className="text-sm font-medium text-black">
            {getToolSheetTitle(activeTool)}
          </p>

          <button
            type="button"
            onClick={onClose}
            className={TOOL_SHEET_ACTION_BUTTON_CLASS}
          >
            Close
          </button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto px-4 pb-6">
          {isTextToolOpen ? (
            <StoryTextToolPanel
              selectedTextOverlay={selectedTextOverlay}
              onAddTextOverlay={onAddTextOverlay}
              onRemoveTextOverlay={onRemoveTextOverlay}
              onOverlayTextChange={onOverlayTextChange}
              onTextOverlayColorChange={onTextOverlayColorChange}
            />
          ) : null}

          {isFilterToolOpen ? (
            <div className={TOOL_SHEET_COMPACT_PANEL_CLASS}>
              <div className="space-y-1">
                <p className="text-sm font-medium text-black">Filter</p>
                <p className="text-sm font-medium text-black">
                  Swipe to change filters
                </p>
              </div>

              <p className="text-xs text-zinc-500">
                Left or right on the preview
              </p>
            </div>
          ) : null}

          {isMusicToolOpen ? (
            <StoryMusicToolPanel
              selectedMusic={selectedMusic}
              selectedMusicStyle={selectedMusicStyle}
              isMusicSelected={isMusicSelected}
              musicQuery={musicQuery}
              musicResults={musicResults}
              isSearchingMusic={isSearchingMusic}
              onMusicQueryChange={onMusicQueryChange}
              onSelectMusic={onSelectMusic}
              onRemoveMusic={onRemoveMusic}
              onChangeMusicStyle={onChangeMusicStyle}
            />
          ) : null}

          {isTrimToolOpen ? (
            <div className={TOOL_SHEET_TRIM_PANEL_CLASS}>
              {!file ? (
                <div className={TOOL_HELP_CARD_CLASS}>
                  Select a video to enable trimming.
                </div>
              ) : null}
              <StoryVideoTrimField file={file} onChange={onTrimChange} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
