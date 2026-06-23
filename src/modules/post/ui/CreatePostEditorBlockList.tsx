"use client"

import type { RefObject } from "react"
import { CreatePostBlockHeaderControls } from "./CreatePostBlockHeaderControls"
import type {
  EditorBlock,
  PostFilterPreset,
} from "./create-post-form-model"
import { PostCarouselBlockEditor } from "./PostCarouselBlockEditor"
import { PostMediaBlockEditor } from "./PostMediaBlockEditor"

type CreatePostEditorBlockListProps = {
  blocks: EditorBlock[]
  draggingBlockId: string | null
  dropTargetBlockId: string | null
  previewContainerRef: RefObject<HTMLDivElement | null>
  filterSwipeStartXRef: RefObject<number | null>
  filterSwipeOffsetX: number
  showFilterIndicator: boolean
  getActiveMediaTool: (blockId: string) => "text" | "filter" | "trim" | null
  onDragOver: (event: React.DragEvent<HTMLDivElement>, blockId: string) => void
  onDrop: (blockId: string) => void
  onClearDropTarget: (blockId: string) => void
  onDragStart: (blockId: string) => void
  onDragEnd: () => void
  onMoveBlockUp: (index: number) => void
  onMoveBlockDown: (index: number) => void
  onRemoveBlock: (blockId: string) => void
  onUpdateTextBlock: (blockId: string, value: string) => void
  onAddCarouselMedia: (blockId: string) => void
  onSetActiveMediaTool: (
    blockId: string,
    tool: "text" | "filter" | "trim" | null
  ) => void
  onEnableImageOverlayText: (blockId: string) => void
  onUpdateImageOverlayText: (blockId: string, text: string) => void
  onUpdateImageOverlayColor: (blockId: string, color: string) => void
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
  onUpdateVideoMuted: (blockId: string, muted: boolean) => void
  onVideoTrimChange: (
    blockId: string,
    nextTrim: {
      duration: number
      requiresTrim: boolean
      startTime: number
    }
  ) => void
}

function getBlockLabel(block: EditorBlock) {
  if (block.type === "text") return "Text block"
  if (block.type === "video") return "Video block"
  if (block.type === "carousel") return "Carousel block"
  return "Image block"
}

export function CreatePostEditorBlockList({
  blocks,
  draggingBlockId,
  dropTargetBlockId,
  previewContainerRef,
  filterSwipeStartXRef,
  filterSwipeOffsetX,
  showFilterIndicator,
  getActiveMediaTool,
  onDragOver,
  onDrop,
  onClearDropTarget,
  onDragStart,
  onDragEnd,
  onMoveBlockUp,
  onMoveBlockDown,
  onRemoveBlock,
  onUpdateTextBlock,
  onAddCarouselMedia,
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
  onUpdateVideoMuted,
  onVideoTrimChange,
}: CreatePostEditorBlockListProps) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          onDragOver={(event) => onDragOver(event, block.id)}
          onDrop={() => onDrop(block.id)}
          onDragLeave={() => {
            if (dropTargetBlockId === block.id) {
              onClearDropTarget(block.id)
            }
          }}
          className={`space-y-3 rounded-[28px] border p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition ${
            draggingBlockId === block.id
              ? "border-pink-500/60 bg-zinc-900/80"
              : "border-zinc-800/80 bg-zinc-950/50"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              {getBlockLabel(block)}
            </span>

            <CreatePostBlockHeaderControls
              canMoveUp={index > 0}
              canMoveDown={index < blocks.length - 1}
              isDragging={draggingBlockId === block.id}
              onDragStart={() => onDragStart(block.id)}
              onDragEnd={onDragEnd}
              onMoveUp={() => onMoveBlockUp(index)}
              onMoveDown={() => onMoveBlockDown(index)}
              onRemove={() => onRemoveBlock(block.id)}
            />
          </div>

          {block.type === "text" ? (
            <textarea
              value={block.content ?? ""}
              onChange={(event) =>
                onUpdateTextBlock(block.id, event.target.value)
              }
              placeholder="Write a caption, tell a story, or set the mood for the next block..."
              className="min-h-[220px] w-full resize-none rounded-[24px] border border-pink-500/20 bg-white px-5 py-4 text-[17px] leading-8 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
              autoFocus={index === 0}
            />
          ) : block.type === "carousel" ? (
            <PostCarouselBlockEditor
              block={block}
              onAddMedia={() => onAddCarouselMedia(block.id)}
            />
          ) : (
            <PostMediaBlockEditor
              block={block}
              previewContainerRef={previewContainerRef}
              filterSwipeStartXRef={filterSwipeStartXRef}
              filterSwipeOffsetX={filterSwipeOffsetX}
              showFilterIndicator={showFilterIndicator}
              activeMediaTool={getActiveMediaTool(block.id)}
              onRemove={() => onRemoveBlock(block.id)}
              onSetActiveMediaTool={(tool) =>
                onSetActiveMediaTool(block.id, tool)
              }
              onEnableImageOverlayText={() =>
                onEnableImageOverlayText(block.id)
              }
              onUpdateImageOverlayText={(text) =>
                onUpdateImageOverlayText(block.id, text)
              }
              onUpdateImageOverlayColor={(color) =>
                onUpdateImageOverlayColor(block.id, color)
              }
              onFilterSwipeStart={onFilterSwipeStart}
              onFilterSwipeMove={onFilterSwipeMove}
              onResetFilterSwipe={onResetFilterSwipe}
              onOverlayMouseDown={(event) =>
                onOverlayMouseDown(event, block.id)
              }
              onOverlayWheel={(event) => onOverlayWheel(event, block.id)}
              onOverlayTouchStart={(event) =>
                onOverlayTouchStart(event, block.id)
              }
              onAddCarouselItems={() => onAddCarouselMedia(block.id)}
              onUpdateVideoMuted={(muted) =>
                onUpdateVideoMuted(block.id, muted)
              }
              onVideoTrimChange={(nextTrim) =>
                onVideoTrimChange(block.id, nextTrim)
              }
            />
          )}
        </div>
      ))}
    </div>
  )
}
