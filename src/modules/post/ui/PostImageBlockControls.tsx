"use client"

import type { EditorMediaBlock } from "./create-post-form-model"
import {
  AddCarouselItemsButton,
  MediaToolChip,
  POST_TEXT_COLOR_SWATCHES,
} from "./PostMediaBlockControls"

type ImageEditorBlock = EditorMediaBlock

type PostImageBlockControlsProps = {
  block: ImageEditorBlock
  activeMediaTool: "text" | "filter" | "trim" | null
  onSetActiveMediaTool: (tool: "text" | "filter" | "trim" | null) => void
  onEnableImageOverlayText: () => void
  onUpdateImageOverlayText: (text: string) => void
  onUpdateImageOverlayColor: (color: string) => void
  onAddCarouselItems: () => void
}

export function PostImageBlockControls({
  block,
  activeMediaTool,
  onSetActiveMediaTool,
  onEnableImageOverlayText,
  onUpdateImageOverlayText,
  onUpdateImageOverlayColor,
  onAddCarouselItems,
}: PostImageBlockControlsProps) {
  return (
    <div className="border-t border-zinc-800 bg-zinc-950/80 p-3 pt-0">
      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          <MediaToolChip
            active={activeMediaTool === "text"}
            onClick={() => {
              onEnableImageOverlayText()
              onSetActiveMediaTool("text")
            }}
          >
            Text
          </MediaToolChip>

          <MediaToolChip
            active={activeMediaTool === "filter"}
            onClick={() => onSetActiveMediaTool("filter")}
          >
            Filter
          </MediaToolChip>

          <AddCarouselItemsButton onClick={onAddCarouselItems} />
        </div>

        {block.editorState?.image?.overlayText && activeMediaTool === "text" ? (
          <>
            <input
              type="text"
              value={block.editorState.image.overlayText.text}
              onChange={(event) => onUpdateImageOverlayText(event.target.value)}
              placeholder="Write overlay text..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
            />

            <div className="flex flex-wrap gap-2">
              {POST_TEXT_COLOR_SWATCHES.map((color) => {
                const isActive =
                  (block.editorState?.image?.overlayText?.color ?? "#ffffff") ===
                  color

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onUpdateImageOverlayColor(color)}
                    className={`h-8 w-8 rounded-full border transition ${
                      isActive
                        ? "border-white scale-110"
                        : "border-zinc-600 hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                )
              })}
            </div>

            <p className="text-xs text-zinc-500">
              Drag text to move. Pinch or wheel to resize.
            </p>
          </>
        ) : null}
      </div>
    </div>
  )
}
