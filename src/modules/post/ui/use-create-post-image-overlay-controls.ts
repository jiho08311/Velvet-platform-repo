"use client"

import {
  type Dispatch,
  type SetStateAction,
  useRef,
} from "react"
import {
  clampPosition,
  clampScale,
  getTouchDistance,
  type EditorBlock,
} from "./create-post-form-model"

type UseCreatePostImageOverlayControlsInput = {
  blocks: EditorBlock[]
  setBlocks: Dispatch<SetStateAction<EditorBlock[]>>
}

export function useCreatePostImageOverlayControls({
  blocks,
  setBlocks,
}: UseCreatePostImageOverlayControlsInput) {
  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const overlayPinchStartDistanceRef = useRef<number | null>(null)
  const overlayPinchStartScaleRef = useRef<number | null>(null)

  function ensureImageOverlayText(block: EditorBlock) {
    return {
      text: block.editorState?.image?.overlayText?.text ?? "",
      x: block.editorState?.image?.overlayText?.x ?? 0.5,
      y: block.editorState?.image?.overlayText?.y ?? 0.15,
      color: block.editorState?.image?.overlayText?.color ?? "#ffffff",
      fontSize: block.editorState?.image?.overlayText?.fontSize ?? "md",
      scale: block.editorState?.image?.overlayText?.scale ?? 2,
    } as const
  }

  function enableImageOverlayText(blockId: string) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block
        if (block.type !== "image") return block

        return {
          ...block,
          editorState: {
            ...block.editorState,
            image: {
              filter: block.editorState?.image?.filter ?? "none",
              overlayText: ensureImageOverlayText(block),
            },
          },
        }
      })
    )
  }

  function updateImageOverlayText(blockId: string, text: string) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block
        if (block.type !== "image") return block

        return {
          ...block,
          editorState: {
            ...block.editorState,
            image: {
              filter: block.editorState?.image?.filter ?? "none",
              overlayText: {
                ...ensureImageOverlayText(block),
                text,
              },
            },
          },
        }
      })
    )
  }

  function updateImageOverlayColor(blockId: string, color: string) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block
        if (block.type !== "image") return block

        return {
          ...block,
          editorState: {
            ...block.editorState,
            image: {
              filter: block.editorState?.image?.filter ?? "none",
              overlayText: {
                ...ensureImageOverlayText(block),
                color,
              },
            },
          },
        }
      })
    )
  }

  function updateImageOverlayScale(blockId: string, scale: number) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block
        if (block.type !== "image") return block

        const overlay = block.editorState?.image?.overlayText
        if (!overlay) return block

        return {
          ...block,
          editorState: {
            ...block.editorState,
            image: {
              filter: block.editorState?.image?.filter ?? "none",
              overlayText: {
                ...overlay,
                scale: clampScale(scale),
              },
            },
          },
        }
      })
    )
  }

  function updateImageOverlayPositionFromClientPoint(
    blockId: string,
    clientX: number,
    clientY: number
  ) {
    const container = previewContainerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const nextX = clampPosition((clientX - rect.left) / rect.width)
    const nextY = clampPosition((clientY - rect.top) / rect.height)

    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block
        if (block.type !== "image") return block

        const overlay = block.editorState?.image?.overlayText
        if (!overlay) return block

        return {
          ...block,
          editorState: {
            ...block.editorState,
            image: {
              filter: block.editorState?.image?.filter ?? "none",
              overlayText: {
                ...overlay,
                x: overlay.x + (nextX - overlay.x) * 0.35,
                y: overlay.y + (nextY - overlay.y) * 0.35,
              },
            },
          },
        }
      })
    )
  }

  function handleOverlayMouseDown(
    event: React.MouseEvent<HTMLDivElement>,
    blockId: string
  ) {
    event.preventDefault()
    event.stopPropagation()
    updateImageOverlayPositionFromClientPoint(blockId, event.clientX, event.clientY)

    function handleMove(moveEvent: MouseEvent) {
      updateImageOverlayPositionFromClientPoint(
        blockId,
        moveEvent.clientX,
        moveEvent.clientY
      )
    }

    function handleUp() {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
  }

  function handleOverlayWheel(
    event: React.WheelEvent<HTMLDivElement>,
    blockId: string
  ) {
    event.preventDefault()
    event.stopPropagation()

    const block = blocks.find((item) => item.id === blockId)
    if (!block || block.type !== "image") return

    const direction = event.deltaY < 0 ? 1 : -1
    const currentScale = block.editorState?.image?.overlayText?.scale ?? 1
    updateImageOverlayScale(blockId, currentScale + direction * 0.12)
  }

  function handleOverlayTouchStart(
    event: React.TouchEvent<HTMLDivElement>,
    blockId: string
  ) {
    event.stopPropagation()

    const firstTouch = event.touches[0]
    const secondTouch = event.touches[1]
    const block = blocks.find((item) => item.id === blockId)
    if (!block || block.type !== "image") return

    const currentScale = block.editorState?.image?.overlayText?.scale ?? 1

    if (firstTouch && secondTouch) {
      overlayPinchStartDistanceRef.current = getTouchDistance(
        firstTouch,
        secondTouch
      )
      overlayPinchStartScaleRef.current = currentScale
      return
    }

    if (!firstTouch) return

    updateImageOverlayPositionFromClientPoint(
      blockId,
      firstTouch.clientX,
      firstTouch.clientY
    )

    function handleTouchMove(moveEvent: TouchEvent) {
      moveEvent.preventDefault()

      const touchA = moveEvent.touches[0]
      const touchB = moveEvent.touches[1]

      if (touchA && touchB) {
        const startDistance = overlayPinchStartDistanceRef.current
        const startScale = overlayPinchStartScaleRef.current ?? 1

        if (!startDistance || startDistance <= 0) return

        updateImageOverlayScale(
          blockId,
          startScale * (getTouchDistance(touchA, touchB) / startDistance)
        )
        return
      }

      const nextTouch = moveEvent.touches[0]
      if (!nextTouch) return

      updateImageOverlayPositionFromClientPoint(
        blockId,
        nextTouch.clientX,
        nextTouch.clientY
      )
    }

    function handleTouchEnd() {
      overlayPinchStartDistanceRef.current = null
      overlayPinchStartScaleRef.current = null
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("touchcancel", handleTouchEnd)
    }

    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("touchcancel", handleTouchEnd)
  }

  return {
    enableImageOverlayText,
    handleOverlayMouseDown,
    handleOverlayTouchStart,
    handleOverlayWheel,
    previewContainerRef,
    updateImageOverlayColor,
    updateImageOverlayText,
  }
}
