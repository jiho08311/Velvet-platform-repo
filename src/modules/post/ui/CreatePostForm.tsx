"use client"

import { FormEvent, useRef, useState } from "react"
import type { PostVisibility } from "@/modules/post/types"
import {
  createBlockId,
  createDefaultImageEditorState,
  createDefaultVideoEditorState,
  createInitialEditorBlocks,
  createUploadedMediaSource,
  normalizeEditorBlocks,
  type CarouselEditorItem,
  type CreatePostFormProps,
  type EditorBlock,
  type PublishMode,
} from "./create-post-form-model"
import { serializeEditorBlocksForSubmit } from "./create-post-form-submit"
import { CreatePostEditorBlockList } from "./CreatePostEditorBlockList"
import { PostComposerSubmitBar } from "./PostComposerSubmitBar"
import { resolveCreatePostSubmitCTA } from "./post-composer-ui-state"
import { useCreatePostBlockOrdering } from "./use-create-post-block-ordering"
import { useCreatePostMediaEditorControls } from "./use-create-post-media-editor-controls"

export function CreatePostForm({
  isSubmitting = false,
  onSubmitPost,
  initialTextBlocks,
  initialVisibility,
  initialBlocks,
  visibilityOptions = ["public", "subscribers"],
  showPublishMode = true,
  submitLabel,
  resetAfterSubmit = true,
}: CreatePostFormProps) {
const [blocks, setBlocks] = useState<EditorBlock[]>(() =>
  createInitialEditorBlocks({
    initialBlocks,
    initialTextBlocks,
  })
)



  const [visibility, setVisibility] = useState<PostVisibility>(
    initialVisibility ?? "subscribers"
  )

  const [publishMode, setPublishMode] = useState<PublishMode>("now")
const [publishedAt, setPublishedAt] = useState("")
  const submitCTA = submitLabel
    ? {
        label: isSubmitting ? `${submitLabel}...` : submitLabel,
        disabled: isSubmitting,
      }
    : resolveCreatePostSubmitCTA({
        isSubmitting,
        publishMode,
      })
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null)
const [dropTargetBlockId, setDropTargetBlockId] = useState<string | null>(null)

const fileInputRef = useRef<HTMLInputElement | null>(null)
const carouselFileInputRef = useRef<HTMLInputElement | null>(null)
const pendingCarouselBlockIdRef = useRef<string | null>(null)
  const {
    enableImageOverlayText,
    filterSwipeOffsetX,
    filterSwipeStartXRef,
    getActiveMediaTool,
    handleFilterSwipeMove,
    handleFilterSwipeStart,
    handleOverlayMouseDown,
    handleOverlayTouchStart,
    handleOverlayWheel,
    handleVideoTrimChange,
    previewContainerRef,
    resetFilterSwipe,
    resetMediaEditorControls,
    setActiveMediaTool,
    setActiveMediaToolByBlock,
    showFilterIndicator,
    updateImageOverlayColor,
    updateImageOverlayText,
    updateVideoMuted,
  } = useCreatePostMediaEditorControls({
    blocks,
    setBlocks,
  })
  const {
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    handleDrop,
    moveBlockDown,
    moveBlockUp,
    removeBlock,
  } = useCreatePostBlockOrdering({
    draggingBlockId,
    dropTargetBlockId,
    pendingCarouselBlockIdRef,
    setActiveMediaToolByBlock,
    setBlocks,
    setDraggingBlockId,
    setDropTargetBlockId,
  })

  function updateTextBlock(blockId: string, value: string) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId && block.type === "text"
          ? { ...block, content: value }
          : block
      )
    )
  }

  function addTextBlock() {
    setBlocks((prev) =>
      normalizeEditorBlocks([
        ...prev,
        {
          id: createBlockId(),
          type: "text",
          sortOrder: prev.length,
          content: "",
        },
      ])
    )
  }

function addCarouselItems(blockId: string, nextFiles: File[]) {
  if (nextFiles.length === 0) {
    if (carouselFileInputRef.current) {
      carouselFileInputRef.current.value = ""
    }
    return
  }

  const nextItems: CarouselEditorItem[] = nextFiles.map((file) => {
    const isVideo = file.type.startsWith("video/")

    return {
      id: createBlockId(),
      type: isVideo ? "video" : "image",
      media: createUploadedMediaSource(file, isVideo ? "video" : "image"),
      file,
      previewUrl: URL.createObjectURL(file),
      editorState: isVideo
        ? createDefaultVideoEditorState()
        : createDefaultImageEditorState(),
      content: null,
    }
  })

  setBlocks((prev) =>
    normalizeEditorBlocks(prev.map((block) => {
      if (block.id !== blockId) {
        return block
      }

      if (block.type === "carousel") {
        return {
          ...block,
          items: [...block.items, ...nextItems],
        }
      }

      if (block.type === "image" || block.type === "video") {
        const currentItem: CarouselEditorItem = {
          id: createBlockId(),
          type: block.type,
          media: block.media,
          file: block.file,
          previewUrl: block.previewUrl,
          editorState: block.editorState ?? null,
        }

        return {
          id: block.id,
          type: "carousel",
          sortOrder: block.sortOrder,
          items: [currentItem, ...nextItems],
          editorState: null,
          content: undefined,
        }
      }

      return block
    }))
  )

  if (carouselFileInputRef.current) {
    carouselFileInputRef.current.value = ""
  }
}
  function addMediaBlocks(nextFiles: File[]) {
    if (nextFiles.length === 0) return

    const nextBlocks: EditorBlock[] = nextFiles.map((file) => {
      const isVideo = file.type.startsWith("video/")

      return {
        id: createBlockId(),
        type: isVideo ? "video" : "image",
        sortOrder: 0,
        media: createUploadedMediaSource(file, isVideo ? "video" : "image"),
        file,
        previewUrl: URL.createObjectURL(file),
        editorState: isVideo
          ? createDefaultVideoEditorState()
          : createDefaultImageEditorState(),
        content: null,
      }
    })

    setBlocks((prev) => normalizeEditorBlocks([...prev, ...nextBlocks]))

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }



  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

const serialized = serializeEditorBlocksForSubmit(blocks)

onSubmitPost({
  visibility,
  publishMode,
  publishedAt: publishMode === "scheduled" ? publishedAt : null,
  blocks: serialized.blocks,
  uploadedFiles: serialized.uploadedFiles,
})

    if (resetAfterSubmit) {
      setBlocks(
        normalizeEditorBlocks([
          { id: createBlockId(), type: "text", sortOrder: 0, content: "" },
        ])
      )
      setVisibility("subscribers")
      setPublishMode("now")
      setPublishedAt("")
      setDraggingBlockId(null)
      setDropTargetBlockId(null)
      resetMediaEditorControls()

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <CreatePostEditorBlockList
        blocks={blocks}
        draggingBlockId={draggingBlockId}
        dropTargetBlockId={dropTargetBlockId}
        previewContainerRef={previewContainerRef}
        filterSwipeStartXRef={filterSwipeStartXRef}
        filterSwipeOffsetX={filterSwipeOffsetX}
        showFilterIndicator={showFilterIndicator}
        getActiveMediaTool={getActiveMediaTool}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClearDropTarget={() => setDropTargetBlockId(null)}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMoveBlockUp={moveBlockUp}
        onMoveBlockDown={moveBlockDown}
        onRemoveBlock={removeBlock}
        onUpdateTextBlock={updateTextBlock}
        onAddCarouselMedia={(blockId) => {
          pendingCarouselBlockIdRef.current = blockId
          carouselFileInputRef.current?.click()
        }}
        onSetActiveMediaTool={setActiveMediaTool}
        onEnableImageOverlayText={enableImageOverlayText}
        onUpdateImageOverlayText={updateImageOverlayText}
        onUpdateImageOverlayColor={updateImageOverlayColor}
        onFilterSwipeStart={handleFilterSwipeStart}
        onFilterSwipeMove={handleFilterSwipeMove}
        onResetFilterSwipe={resetFilterSwipe}
        onOverlayMouseDown={handleOverlayMouseDown}
        onOverlayWheel={handleOverlayWheel}
        onOverlayTouchStart={handleOverlayTouchStart}
        onUpdateVideoMuted={updateVideoMuted}
        onVideoTrimChange={handleVideoTrimChange}
      />

      <PostComposerSubmitBar
        visibility={visibility}
        onVisibilityChange={setVisibility}
        visibilityOptions={visibilityOptions}
        showPublishMode={showPublishMode}
        publishMode={publishMode}
        onPublishModeChange={setPublishMode}
        publishedAt={publishedAt}
        onPublishedAtChange={setPublishedAt}
        fileInputRef={fileInputRef}
        carouselFileInputRef={carouselFileInputRef}
        pendingCarouselBlockIdRef={pendingCarouselBlockIdRef}
        onAddTextBlock={addTextBlock}
        onAddMediaBlocks={addMediaBlocks}
        onAddCarouselItems={addCarouselItems}
        submitCTA={submitCTA}
      />
    </form>
  )
}
