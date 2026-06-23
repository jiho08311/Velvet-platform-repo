"use client"

import { StoryVideoTrimField } from "@/modules/media/public/story-video-trim-field-ui"
import type { EditorMediaBlock } from "./create-post-form-model"
import {
  AddCarouselItemsButton,
  MediaToolChip,
  MinorCTAButton,
} from "./PostMediaBlockControls"

type ActiveMediaTool = "text" | "filter" | "trim" | null

type PostVideoBlockControlsProps = {
  block: EditorMediaBlock
  activeMediaTool: ActiveMediaTool
  onSetActiveMediaTool: (tool: ActiveMediaTool) => void
  onAddCarouselItems: () => void
  onUpdateVideoMuted: (muted: boolean) => void
  onVideoTrimChange: (nextTrim: {
    duration: number
    requiresTrim: boolean
    startTime: number
  }) => void
}

export function PostVideoBlockControls({
  block,
  activeMediaTool,
  onSetActiveMediaTool,
  onAddCarouselItems,
  onUpdateVideoMuted,
  onVideoTrimChange,
}: PostVideoBlockControlsProps) {
  const isMuted = block.editorState?.video?.muted ?? true

  return (
    <div className="space-y-3 border-t border-zinc-800 bg-zinc-950/80 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <MediaToolChip
          active={activeMediaTool === "trim"}
          onClick={() => onSetActiveMediaTool("trim")}
        >
          Trim
        </MediaToolChip>

        <AddCarouselItemsButton onClick={onAddCarouselItems} />

        <MinorCTAButton onClick={() => onUpdateVideoMuted(!isMuted)}>
          {isMuted ? "Sound On" : "Muted"}
        </MinorCTAButton>
      </div>

      {activeMediaTool === "trim" ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
          <StoryVideoTrimField
            file={block.file ?? null}
            onChange={onVideoTrimChange}
          />
        </div>
      ) : null}
    </div>
  )
}
