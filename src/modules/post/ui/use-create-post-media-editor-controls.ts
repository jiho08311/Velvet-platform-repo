"use client"

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  FILTER_PRESETS,
  FILTER_SWIPE_THRESHOLD,
  type EditorBlock,
  type PostFilterPreset,
} from "./create-post-form-model"
import { useCreatePostImageOverlayControls } from "./use-create-post-image-overlay-controls"

type ActiveMediaTool = "text" | "filter" | "trim" | null

type UseCreatePostMediaEditorControlsInput = {
  blocks: EditorBlock[]
  setBlocks: Dispatch<SetStateAction<EditorBlock[]>>
}

export function useCreatePostMediaEditorControls({
  blocks,
  setBlocks,
}: UseCreatePostMediaEditorControlsInput) {
  const [activeMediaToolByBlock, setActiveMediaToolByBlock] = useState<
    Record<string, ActiveMediaTool>
  >({})
  const filterSwipeStartXRef = useRef<number | null>(null)
  const filterSwipeTriggeredRef = useRef(false)
  const filterIndicatorTimeoutRef = useRef<number | null>(null)
  const [showFilterIndicator, setShowFilterIndicator] = useState(false)
  const [filterSwipeOffsetX, setFilterSwipeOffsetX] = useState(0)
  const {
    enableImageOverlayText,
    handleOverlayMouseDown,
    handleOverlayTouchStart,
    handleOverlayWheel,
    previewContainerRef,
    updateImageOverlayColor,
    updateImageOverlayText,
  } = useCreatePostImageOverlayControls({
    blocks,
    setBlocks,
  })

  useEffect(() => {
    return () => {
      if (filterIndicatorTimeoutRef.current) {
        window.clearTimeout(filterIndicatorTimeoutRef.current)
      }
    }
  }, [])

  function getActiveMediaTool(blockId: string) {
    return activeMediaToolByBlock[blockId] ?? null
  }

  function setActiveMediaTool(blockId: string, tool: ActiveMediaTool) {
    setActiveMediaToolByBlock((prev) => ({
      ...prev,
      [blockId]: tool,
    }))
  }

  function updateImageFilter(blockId: string, filter: PostFilterPreset) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block
        if (block.type !== "image") return block

        return {
          ...block,
          editorState: {
            ...block.editorState,
            image: {
              filter,
              overlayText: block.editorState?.image?.overlayText ?? null,
            },
          },
        }
      })
    )
  }

  function showActiveFilterIndicator() {
    setShowFilterIndicator(true)

    if (filterIndicatorTimeoutRef.current) {
      window.clearTimeout(filterIndicatorTimeoutRef.current)
    }

    filterIndicatorTimeoutRef.current = window.setTimeout(() => {
      setShowFilterIndicator(false)
    }, 900)
  }

  function moveImageFilterBy(
    blockId: string,
    currentPreset: PostFilterPreset,
    direction: "next" | "prev"
  ) {
    const currentIndex = FILTER_PRESETS.indexOf(currentPreset)
    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex =
      direction === "next"
        ? Math.min(FILTER_PRESETS.length - 1, safeCurrentIndex + 1)
        : Math.max(0, safeCurrentIndex - 1)
    const nextPreset = FILTER_PRESETS[nextIndex]

    if (nextPreset === currentPreset) {
      showActiveFilterIndicator()
      return
    }

    updateImageFilter(blockId, nextPreset)
    showActiveFilterIndicator()
  }

  function handleFilterSwipeStart(clientX: number) {
    filterSwipeStartXRef.current = clientX
    filterSwipeTriggeredRef.current = false
    setFilterSwipeOffsetX(0)
  }

  function handleFilterSwipeMove(
    clientX: number,
    blockId: string,
    currentPreset: PostFilterPreset
  ) {
    const startX = filterSwipeStartXRef.current
    if (startX === null) return

    const deltaX = clientX - startX
    setFilterSwipeOffsetX(Math.max(-18, Math.min(18, deltaX * 0.18)))

    if (filterSwipeTriggeredRef.current) return
    if (Math.abs(deltaX) < FILTER_SWIPE_THRESHOLD) return

    filterSwipeTriggeredRef.current = true
    moveImageFilterBy(blockId, currentPreset, deltaX < 0 ? "next" : "prev")
  }

  function resetFilterSwipe() {
    filterSwipeStartXRef.current = null
    filterSwipeTriggeredRef.current = false
    setFilterSwipeOffsetX(0)
  }

  function updateVideoMuted(blockId: string, muted: boolean) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block
        if (block.type !== "video") return block

        return {
          ...block,
          editorState: {
            ...block.editorState,
            video: {
              trimStart: block.editorState?.video?.trimStart ?? 0,
              trimEnd: block.editorState?.video?.trimEnd ?? null,
              muted,
            },
          },
        }
      })
    )
  }

  function handleVideoTrimChange(
    blockId: string,
    nextTrim: {
      duration: number
      requiresTrim: boolean
      startTime: number
    }
  ) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block
        if (block.type !== "video") return block

        return {
          ...block,
          editorState: {
            ...block.editorState,
            video: {
              trimStart: nextTrim.startTime,
              trimEnd: nextTrim.requiresTrim
                ? nextTrim.startTime + nextTrim.duration
                : null,
              muted: block.editorState?.video?.muted ?? true,
            },
          },
        }
      })
    )
  }

  function resetMediaEditorControls() {
    setActiveMediaToolByBlock({})
    setShowFilterIndicator(false)
    setFilterSwipeOffsetX(0)
  }

  return {
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
    enableImageOverlayText,
  }
}
