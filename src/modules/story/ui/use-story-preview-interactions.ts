"use client"

import {
  type Dispatch,
  type SetStateAction,
  useRef,
} from "react"
import type {
  StoryEditorState,
  StoryEditorTool,
  StoryEditorUiState,
} from "../types"
import {
  clampPosition,
  type StoryFilterPreset,
} from "./create-story-form-model"
import { useStoryFilterSwipeControls } from "./use-story-filter-swipe-controls"
import { useStoryMusicStickerInteractions } from "./use-story-music-sticker-interactions"

type UseStoryPreviewInteractionsInput = {
  activeTool: StoryEditorTool
  editorState: StoryEditorState
  isDragging: boolean
  previewUrl: string | null
  selectedFilterPreset: StoryFilterPreset
  setEditorState: Dispatch<SetStateAction<StoryEditorState>>
  setUiState: Dispatch<SetStateAction<StoryEditorUiState>>
}

function getTouchDistance(
  touchA: { clientX: number; clientY: number },
  touchB: { clientX: number; clientY: number }
) {
  const dx = touchA.clientX - touchB.clientX
  const dy = touchA.clientY - touchB.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

export function useStoryPreviewInteractions({
  activeTool,
  editorState,
  isDragging,
  previewUrl,
  selectedFilterPreset,
  setEditorState,
  setUiState,
}: UseStoryPreviewInteractionsInput) {
  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const textPinchStartDistanceRef = useRef<number | null>(null)
  const textPinchStartScaleRef = useRef<number | null>(null)
  const {
    filterSwipeOffsetX,
    filterSwipeStartXRef,
    handleFilterSwipeMove,
    handleFilterSwipeStart,
    resetFilterSwipe,
    showFilterIndicator,
  } = useStoryFilterSwipeControls({
    activeTool,
    isDragging,
    previewUrl,
    selectedFilterPreset,
    setEditorState,
  })
  const {
    handleMusicStickerMouseDown,
    handleMusicStickerTouchStart,
  } = useStoryMusicStickerInteractions({
    activeTool,
    previewContainerRef,
    resetFilterSwipe,
    setEditorState,
    setUiState,
  })

  function updateTextOverlayPositionFromClientPoint(
    overlayId: string,
    clientX: number,
    clientY: number
  ) {
    const container = previewContainerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const nextX = clampPosition((clientX - rect.left) / rect.width)
    const nextY = clampPosition((clientY - rect.top) / rect.height)

    setEditorState((prev) => ({
      ...prev,
      textOverlays: (prev.textOverlays ?? []).map((overlay) =>
        overlay.id === overlayId
          ? {
              ...overlay,
              x: overlay.x + (nextX - overlay.x) * 0.35,
              y: overlay.y + (nextY - overlay.y) * 0.35,
            }
          : overlay
      ),
    }))
  }

  function handleChangeTextOverlayScale(overlayId: string, scale: number) {
    const nextScale = Math.min(4, Math.max(0.8, scale))

    setEditorState((prev) => ({
      ...prev,
      textOverlays: (prev.textOverlays ?? []).map((overlay) =>
        overlay.id === overlayId
          ? {
              ...overlay,
              scale: nextScale,
            }
          : overlay
      ),
    }))
  }

  function handleSelectedLayerMouseDown(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    resetFilterSwipe()

    if (activeTool !== "text") return

    event.preventDefault()
    event.stopPropagation()

    const overlayId = event.currentTarget.dataset.overlayId
    if (!overlayId) return

    setUiState((prev) => ({
      ...prev,
      isDragging: true,
      selectedLayer: {
        type: "text",
        id: overlayId,
      },
    }))

    updateTextOverlayPositionFromClientPoint(
      overlayId,
      event.clientX,
      event.clientY
    )

    function handleMouseMove(moveEvent: MouseEvent) {
      updateTextOverlayPositionFromClientPoint(
        overlayId as string,
        moveEvent.clientX,
        moveEvent.clientY
      )
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

  function handleSelectedLayerTouchStart(
    event: React.TouchEvent<HTMLDivElement>
  ) {
    resetFilterSwipe()

    if (activeTool !== "text") return

    event.stopPropagation()

    const overlayId = event.currentTarget.dataset.overlayId
    if (!overlayId) return

    const currentOverlay = (editorState.textOverlays ?? []).find(
      (overlay) => overlay.id === overlayId
    )

    setUiState((prev) => ({
      ...prev,
      selectedLayer: {
        type: "text",
        id: overlayId,
      },
    }))

    const firstTouch = event.touches[0]
    if (!firstTouch) return

    const secondTouch = event.touches[1]

    setUiState((prev) => ({
      ...prev,
      isDragging: !secondTouch,
    }))

    if (secondTouch) {
      textPinchStartDistanceRef.current = getTouchDistance(
        firstTouch,
        secondTouch
      )
      textPinchStartScaleRef.current = currentOverlay?.scale ?? 1
      return
    }

    updateTextOverlayPositionFromClientPoint(
      overlayId,
      firstTouch.clientX,
      firstTouch.clientY
    )

    function handleTouchMove(moveEvent: TouchEvent) {
      moveEvent.preventDefault()
      const touchA = moveEvent.touches[0]
      const touchB = moveEvent.touches[1]

      if (touchA && touchB) {
        const startDistance = textPinchStartDistanceRef.current
        const startScale = textPinchStartScaleRef.current ?? 1
        if (!startDistance || startDistance <= 0) return

        const ratio = getTouchDistance(touchA, touchB) / startDistance
        const speed = 1.6

        setUiState((prev) => ({
          ...prev,
          isDragging: false,
        }))
        handleChangeTextOverlayScale(
          overlayId as string,
          startScale * Math.pow(ratio, speed)
        )
        return
      }

      const nextTouch = moveEvent.touches[0]
      if (!nextTouch) return

      updateTextOverlayPositionFromClientPoint(
        overlayId as string,
        nextTouch.clientX,
        nextTouch.clientY
      )
    }

    function handleTouchEnd() {
      textPinchStartDistanceRef.current = null
      textPinchStartScaleRef.current = null

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
    filterSwipeOffsetX,
    filterSwipeStartXRef,
    handleFilterSwipeMove,
    handleFilterSwipeStart,
    handleMusicStickerMouseDown,
    handleMusicStickerTouchStart,
    handleSelectedLayerMouseDown,
    handleSelectedLayerTouchStart,
    previewContainerRef,
    resetFilterSwipe,
    showFilterIndicator,
  }
}
