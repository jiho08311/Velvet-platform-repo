"use client"

import type { MutableRefObject } from "react"
import type {
  StoryEditorTool,
  StoryMusic,
  StorySelectedLayer,
  StoryTextOverlay,
} from "../types"
import {
  STORY_TOOL_CONTROLS,
  getStoryToolControlClassName,
  type StoryMusicStyle,
  type StoryTool,
} from "./create-story-form-model"
import { StoryPreviewSurface } from "./StoryPreviewSurface"

type CreateStoryEditorCanvasProps = {
  activeTool: StoryEditorTool
  file: File | null
  filterSwipeOffsetX: number
  filterSwipeStartXRef: MutableRefObject<number | null>
  isDragging: boolean
  isMusicSelected: boolean
  isSubmitting: boolean
  onCancel: () => void
  onClearSelectedLayer: () => void
  onFilterSwipeMove: (clientX: number) => void
  onFilterSwipeStart: (clientX: number) => void
  onMusicStickerMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void
  onMusicStickerTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void
  onOpenFilePicker: () => void
  onOpenMusicTool: (event: React.MouseEvent<HTMLButtonElement>) => void
  onOpenTool: (tool: StoryTool) => void
  onRemoveSelectedFile: () => void
  onResetFilterSwipe: () => void
  onSelectedLayerMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void
  onSelectedLayerTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void
  previewContainerRef: MutableRefObject<HTMLDivElement | null>
  previewUrl: string | null
  selectedFilterPreset: string
  selectedLayer: StorySelectedLayer
  selectedMusic: StoryMusic | null | undefined
  selectedMusicStyle: StoryMusicStyle
  showFilterIndicator: boolean
  textOverlays?: StoryTextOverlay[]
}

export function CreateStoryEditorCanvas({
  activeTool,
  file,
  filterSwipeOffsetX,
  filterSwipeStartXRef,
  isDragging,
  isMusicSelected,
  isSubmitting,
  onCancel,
  onClearSelectedLayer,
  onFilterSwipeMove,
  onFilterSwipeStart,
  onMusicStickerMouseDown,
  onMusicStickerTouchStart,
  onOpenFilePicker,
  onOpenMusicTool,
  onOpenTool,
  onRemoveSelectedFile,
  onResetFilterSwipe,
  onSelectedLayerMouseDown,
  onSelectedLayerTouchStart,
  previewContainerRef,
  previewUrl,
  selectedFilterPreset,
  selectedLayer,
  selectedMusic,
  selectedMusicStyle,
  showFilterIndicator,
  textOverlays,
}: CreateStoryEditorCanvasProps) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="sticky top-0 z-30 border-b border-zinc-900/80 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Cancel
          </button>

          <p className="text-sm font-medium text-white">New story</p>

          <div className="w-[72px]" />
        </div>
      </div>

      <div className="flex flex-1 flex-col pb-28 pt-4">
        <div className="flex w-full flex-1 flex-col items-stretch">
          <StoryPreviewSurface
            file={file}
            previewUrl={previewUrl}
            textOverlays={textOverlays}
            selectedLayer={selectedLayer}
            activeTool={activeTool}
            isDragging={isDragging}
            selectedFilterPreset={selectedFilterPreset}
            selectedMusic={selectedMusic}
            selectedMusicStyle={selectedMusicStyle}
            isMusicSelected={isMusicSelected}
            showFilterIndicator={showFilterIndicator}
            filterSwipeOffsetX={filterSwipeOffsetX}
            filterSwipeStartXRef={filterSwipeStartXRef}
            previewContainerRef={previewContainerRef}
            onClearSelectedLayer={onClearSelectedLayer}
            onOpenFilePicker={onOpenFilePicker}
            onRemoveSelectedFile={onRemoveSelectedFile}
            onOpenMusicTool={onOpenMusicTool}
            onFilterSwipeStart={onFilterSwipeStart}
            onFilterSwipeMove={onFilterSwipeMove}
            onResetFilterSwipe={onResetFilterSwipe}
            onSelectedLayerMouseDown={onSelectedLayerMouseDown}
            onSelectedLayerTouchStart={onSelectedLayerTouchStart}
            onMusicStickerMouseDown={onMusicStickerMouseDown}
            onMusicStickerTouchStart={onMusicStickerTouchStart}
          />

          <div className="mt-4 w-full px-4 md:mx-auto md:max-w-[420px] md:px-0">
            <div className="flex items-end justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3 overflow-x-auto pb-1">
                {STORY_TOOL_CONTROLS.map((control) => {
                  const isActive = activeTool === control.tool

                  return (
                    <button
                      key={control.tool}
                      type="button"
                      onClick={() => onOpenTool(control.tool)}
                      className={getStoryToolControlClassName(isActive)}
                    >
                      <span className="text-lg leading-none">
                        {control.icon}
                      </span>
                      <span className="mt-2 text-[11px] font-medium">
                        {control.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mb-1 inline-flex h-16 shrink-0 items-center justify-center rounded-[24px] bg-indigo-500 px-6 text-base font-semibold text-white shadow-[0_12px_30px_rgba(79,70,229,0.35)] transition-all hover:bg-indigo-400 active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? "다음..." : "다음 ->"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
