import type { Dispatch, MutableRefObject, SetStateAction } from "react"

import {
  normalizeEditorBlocks,
  type EditorBlock,
} from "./create-post-form-model"

type UseCreatePostBlockOrderingInput = {
  draggingBlockId: string | null
  dropTargetBlockId: string | null
  pendingCarouselBlockIdRef: MutableRefObject<string | null>
  setActiveMediaToolByBlock: Dispatch<
    SetStateAction<Record<string, "text" | "filter" | "trim" | null>>
  >
  setBlocks: Dispatch<SetStateAction<EditorBlock[]>>
  setDraggingBlockId: Dispatch<SetStateAction<string | null>>
  setDropTargetBlockId: Dispatch<SetStateAction<string | null>>
}

export function useCreatePostBlockOrdering({
  draggingBlockId,
  dropTargetBlockId,
  pendingCarouselBlockIdRef,
  setActiveMediaToolByBlock,
  setBlocks,
  setDraggingBlockId,
  setDropTargetBlockId,
}: UseCreatePostBlockOrderingInput) {
  function handleDragStart(blockId: string) {
    setDraggingBlockId(blockId)
    setDropTargetBlockId(blockId)
  }

  function handleDragEnd() {
    setDraggingBlockId(null)
    setDropTargetBlockId(null)
  }

  function handleDragOver(
    event: React.DragEvent<HTMLDivElement>,
    blockId: string
  ) {
    event.preventDefault()

    if (!draggingBlockId) return
    if (draggingBlockId === blockId) return

    if (dropTargetBlockId !== blockId) {
      setDropTargetBlockId(blockId)
    }
  }

  function handleDrop(targetBlockId: string) {
    if (!draggingBlockId) {
      setDropTargetBlockId(null)
      return
    }

    if (draggingBlockId === targetBlockId) {
      setDraggingBlockId(null)
      setDropTargetBlockId(null)
      return
    }

    setBlocks((prev) => {
      const fromIndex = prev.findIndex((block) => block.id === draggingBlockId)
      const toIndex = prev.findIndex((block) => block.id === targetBlockId)

      if (fromIndex === -1 || toIndex === -1) {
        return prev
      }

      const next = [...prev]
      const [movedBlock] = next.splice(fromIndex, 1)

      if (!movedBlock) {
        return prev
      }

      next.splice(toIndex, 0, movedBlock)
      return normalizeEditorBlocks(next)
    })

    setDraggingBlockId(null)
    setDropTargetBlockId(null)
  }

  function moveBlockUp(index: number) {
    if (index <= 0) return

    setBlocks((prev) => {
      const next = [...prev]
      const [movedBlock] = next.splice(index, 1)

      if (!movedBlock) {
        return prev
      }

      next.splice(index - 1, 0, movedBlock)
      return normalizeEditorBlocks(next)
    })
  }

  function moveBlockDown(index: number) {
    setBlocks((prev) => {
      if (index < 0 || index >= prev.length - 1) {
        return prev
      }

      const next = [...prev]
      const [movedBlock] = next.splice(index, 1)

      if (!movedBlock) {
        return prev
      }

      next.splice(index + 1, 0, movedBlock)
      return normalizeEditorBlocks(next)
    })
  }

  function removeBlock(blockId: string) {
    setBlocks((prev) =>
      normalizeEditorBlocks(prev.filter((block) => block.id !== blockId))
    )

    setActiveMediaToolByBlock((prev) => {
      if (!(blockId in prev)) {
        return prev
      }

      const next = { ...prev }
      delete next[blockId]
      return next
    })

    if (draggingBlockId === blockId) {
      setDraggingBlockId(null)
    }

    if (dropTargetBlockId === blockId) {
      setDropTargetBlockId(null)
    }

    if (pendingCarouselBlockIdRef.current === blockId) {
      pendingCarouselBlockIdRef.current = null
    }
  }

  return {
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    handleDrop,
    moveBlockDown,
    moveBlockUp,
    removeBlock,
  }
}
