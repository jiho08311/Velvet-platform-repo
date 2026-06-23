"use client"

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react"
import type {
  StoryEditorState,
  StoryEditorTool,
} from "../types"
import {
  FILTER_PRESETS,
  FILTER_SWIPE_THRESHOLD,
  type StoryFilterPreset,
} from "./create-story-form-model"

type UseStoryFilterSwipeControlsInput = {
  activeTool: StoryEditorTool
  isDragging: boolean
  previewUrl: string | null
  selectedFilterPreset: StoryFilterPreset
  setEditorState: Dispatch<SetStateAction<StoryEditorState>>
}

export function useStoryFilterSwipeControls({
  activeTool,
  isDragging,
  previewUrl,
  selectedFilterPreset,
  setEditorState,
}: UseStoryFilterSwipeControlsInput) {
  const filterSwipeStartXRef = useRef<number | null>(null)
  const filterSwipeTriggeredRef = useRef(false)
  const filterIndicatorTimeoutRef = useRef<number | null>(null)
  const [showFilterIndicator, setShowFilterIndicator] = useState(false)
  const [filterSwipeOffsetX, setFilterSwipeOffsetX] = useState(0)

  useEffect(() => {
    return () => {
      if (filterIndicatorTimeoutRef.current) {
        window.clearTimeout(filterIndicatorTimeoutRef.current)
      }
    }
  }, [])

  function handleChangeFilter(preset: StoryFilterPreset) {
    setEditorState((prev) => ({
      ...prev,
      filter: {
        preset,
      },
    }))
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

  function moveFilterBy(direction: "next" | "prev") {
    const currentIndex = FILTER_PRESETS.indexOf(selectedFilterPreset)
    const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex =
      direction === "next"
        ? Math.min(FILTER_PRESETS.length - 1, safeCurrentIndex + 1)
        : Math.max(0, safeCurrentIndex - 1)
    const nextPreset = FILTER_PRESETS[nextIndex]

    if (nextPreset === selectedFilterPreset) {
      showActiveFilterIndicator()
      return
    }

    handleChangeFilter(nextPreset)
    showActiveFilterIndicator()
  }

  function handleFilterSwipeStart(clientX: number) {
    if (!previewUrl || isDragging || activeTool !== "filter") return

    filterSwipeStartXRef.current = clientX
    filterSwipeTriggeredRef.current = false
    setFilterSwipeOffsetX(0)
  }

  function handleFilterSwipeMove(clientX: number) {
    if (!previewUrl || isDragging || activeTool !== "filter") return

    const startX = filterSwipeStartXRef.current
    if (startX === null) return

    const deltaX = clientX - startX
    setFilterSwipeOffsetX(Math.max(-18, Math.min(18, deltaX * 0.18)))

    if (filterSwipeTriggeredRef.current) return
    if (Math.abs(deltaX) < FILTER_SWIPE_THRESHOLD) return

    filterSwipeTriggeredRef.current = true
    moveFilterBy(deltaX < 0 ? "next" : "prev")
  }

  function resetFilterSwipe() {
    filterSwipeStartXRef.current = null
    filterSwipeTriggeredRef.current = false
    setFilterSwipeOffsetX(0)
  }

  return {
    filterSwipeOffsetX,
    filterSwipeStartXRef,
    handleFilterSwipeMove,
    handleFilterSwipeStart,
    resetFilterSwipe,
    showFilterIndicator,
  }
}
