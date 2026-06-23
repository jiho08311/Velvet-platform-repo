"use client"

import type {
  Dispatch,
  RefObject,
  SetStateAction,
} from "react"
import type {
  StoryEditorState,
  StoryEditorTool,
  StoryEditorUiState,
} from "../types"
import { clampPosition } from "./create-story-form-model"

type UseStoryMusicStickerInteractionsInput = {
  activeTool: StoryEditorTool
  previewContainerRef: RefObject<HTMLDivElement | null>
  resetFilterSwipe: () => void
  setEditorState: Dispatch<SetStateAction<StoryEditorState>>
  setUiState: Dispatch<SetStateAction<StoryEditorUiState>>
}

export function useStoryMusicStickerInteractions({
  activeTool,
  previewContainerRef,
  resetFilterSwipe,
  setEditorState,
  setUiState,
}: UseStoryMusicStickerInteractionsInput) {
  function updateMusicPositionFromClientPoint(clientX: number, clientY: number) {
    const container = previewContainerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const nextX = clampPosition((clientX - rect.left) / rect.width)
    const nextY = clampPosition((clientY - rect.top) / rect.height)

    setEditorState((prev) => {
      if (!prev.music) return prev

      return {
        ...prev,
        music: {
          ...prev.music,
          x: (prev.music.x ?? 0.5) + (nextX - (prev.music.x ?? 0.5)) * 0.35,
          y: (prev.music.y ?? 0.5) + (nextY - (prev.music.y ?? 0.5)) * 0.35,
        },
      }
    })
  }

  function handleMusicStickerMouseDown(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    resetFilterSwipe()

    if (activeTool !== "music") return

    event.preventDefault()
    event.stopPropagation()

    setUiState((prev) => ({
      ...prev,
      isDragging: true,
      selectedLayer: {
        type: "music",
        id: "music",
      },
    }))

    updateMusicPositionFromClientPoint(event.clientX, event.clientY)

    function handleMouseMove(moveEvent: MouseEvent) {
      updateMusicPositionFromClientPoint(moveEvent.clientX, moveEvent.clientY)
    }

    function handleMouseUp() {
      setUiState((prev) => ({
        ...prev,
        isDragging: false,
      }))
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  function handleMusicStickerTouchStart(
    event: React.TouchEvent<HTMLDivElement>
  ) {
    resetFilterSwipe()

    if (activeTool !== "music") return

    event.stopPropagation()

    setUiState((prev) => ({
      ...prev,
      isDragging: true,
      selectedLayer: {
        type: "music",
        id: "music",
      },
    }))

    const touch = event.touches[0]
    if (!touch) return

    updateMusicPositionFromClientPoint(touch.clientX, touch.clientY)

    function handleTouchMove(moveEvent: TouchEvent) {
      moveEvent.preventDefault()
      const nextTouch = moveEvent.touches[0]
      if (!nextTouch) return

      updateMusicPositionFromClientPoint(nextTouch.clientX, nextTouch.clientY)
    }

    function handleTouchEnd() {
      setUiState((prev) => ({
        ...prev,
        isDragging: false,
      }))
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("touchcancel", handleTouchEnd)
    }

    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("touchcancel", handleTouchEnd)
  }

  return {
    handleMusicStickerMouseDown,
    handleMusicStickerTouchStart,
  }
}
