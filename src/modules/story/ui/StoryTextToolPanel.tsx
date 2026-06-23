"use client"

import {
  TEXT_COLOR_SWATCHES,
  TOOL_HELP_CARD_CLASS,
  TOOL_HELP_CARD_LOOSE_CLASS,
  TOOL_SHEET_ACTION_BUTTON_CLASS,
  TOOL_SHEET_PANEL_CLASS,
} from "./create-story-form-model"
import type { StoryTextOverlay } from "../types"

type StoryTextToolPanelProps = {
  selectedTextOverlay: StoryTextOverlay | null
  onAddTextOverlay: () => void
  onRemoveTextOverlay: () => void
  onOverlayTextChange: (value: string) => void
  onTextOverlayColorChange: (color: string) => void
}

export function StoryTextToolPanel({
  selectedTextOverlay,
  onAddTextOverlay,
  onRemoveTextOverlay,
  onOverlayTextChange,
  onTextOverlayColorChange,
}: StoryTextToolPanelProps) {
  return (
    <div className={TOOL_SHEET_PANEL_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-black">Text overlay</p>
          <p className="text-xs text-zinc-500">
            Add text on top of your story preview
          </p>
        </div>

        {selectedTextOverlay ? (
          <button
            type="button"
            onClick={onRemoveTextOverlay}
            className={TOOL_SHEET_ACTION_BUTTON_CLASS}
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={onAddTextOverlay}
            className={TOOL_SHEET_ACTION_BUTTON_CLASS}
          >
            Add text
          </button>
        )}
      </div>

      {selectedTextOverlay ? (
        <>
          <textarea
            value={selectedTextOverlay.text}
            onChange={(event) => onOverlayTextChange(event.target.value)}
            placeholder="Write overlay text..."
            className="min-h-[120px] w-full resize-none rounded-[20px] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-black outline-none placeholder:text-zinc-400"
          />

          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">Color</p>
              <div className="flex flex-wrap gap-2">
                {TEXT_COLOR_SWATCHES.map((color) => {
                  const isActive =
                    (selectedTextOverlay.color ?? "#ffffff") === color

                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onTextOverlayColorChange(color)}
                      className={`h-8 w-8 rounded-full border transition ${
                        isActive
                          ? "border-black scale-110"
                          : "border-zinc-300 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <div className={TOOL_HELP_CARD_CLASS}>
            Drag to move. Pinch with two fingers to resize.
          </div>

          <p className="text-xs text-zinc-500">
            x: {selectedTextOverlay.x.toFixed(2)} / y:{" "}
            {selectedTextOverlay.y.toFixed(2)}
          </p>
        </>
      ) : (
        <div className={TOOL_HELP_CARD_LOOSE_CLASS}>
          Tap "Add text" to start, then drag it on the preview.
        </div>
      )}
    </div>
  )
}
