"use client"

import { FormEvent, useRef, useState } from "react"
import type { PostBlockEditorState } from "@/modules/post/types"

type PostVisibility = "public" | "subscribers"

type CreatePostBlockInput = {
  type: "text" | "image" | "video" | "audio" | "file"
  content?: string | null
  sortOrder: number
  mediaId?: string | null
  editorState?: PostBlockEditorState
}

type SubmitPostInput = {
  visibility: PostVisibility
  files: File[]
  blocks: CreatePostBlockInput[]
}

type CreatePostFormProps = {
  isSubmitting?: boolean
  onSubmitPost: (input: SubmitPostInput) => void
  initialTextBlocks?: string[]
  initialVisibility?: PostVisibility
  initialBlocks?: {
    type: "text" | "image" | "video"
    content?: string | null
    url?: string | null
    mediaId?: string | null
    editorState?: PostBlockEditorState
  }[]
}

type EditorBlock = {
  id: string
  type: "text" | "image" | "video"
  content?: string
  file?: File
  previewUrl?: string
  mediaId?: string
  editorState?: PostBlockEditorState
}

function createBlockId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function clampPosition(value: number) {
  return Math.min(0.98, Math.max(0.02, value))
}

function clampScale(value: number) {
  return Math.min(4, Math.max(0.8, value))
}

function getTouchDistance(
  touchA: { clientX: number; clientY: number },
  touchB: { clientX: number; clientY: number }
) {
  const dx = touchA.clientX - touchB.clientX
  const dy = touchA.clientY - touchB.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function createDefaultImageEditorState(): PostBlockEditorState {
  return {
    image: {
      filter: "none",
      overlayText: null,
    },
  }
}

function createDefaultVideoEditorState(): PostBlockEditorState {
  return {
    video: {
      trimStart: 0,
      trimEnd: null,
      muted: true,
    },
  }
}

function getFilterStyle(filter?: string) {
  switch (filter) {
    case "warm":
      return { filter: "sepia(0.3) saturate(1.2)" }
    case "cool":
      return { filter: "hue-rotate(180deg) saturate(1.1)" }
    case "mono":
      return { filter: "grayscale(1)" }
    case "vivid":
      return { filter: "contrast(1.2) saturate(1.4)" }
    default:
      return { filter: "none" }
  }
}

export function CreatePostForm({
  isSubmitting = false,
  onSubmitPost,
  initialTextBlocks,
  initialVisibility,
  initialBlocks,
}: CreatePostFormProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      return initialBlocks.map((b) => ({
        id: createBlockId(),
        type: b.type,
        content: b.type === "text" ? b.content ?? "" : undefined,
        previewUrl: b.url ?? undefined,
        mediaId: b.mediaId ?? undefined,
        editorState:
          b.editorState ??
          (b.type === "image"
            ? createDefaultImageEditorState()
            : b.type === "video"
              ? createDefaultVideoEditorState()
              : undefined),
      }))
    }

    return (initialTextBlocks ?? [""]).map((content) => ({
      id: createBlockId(),
      type: "text" as const,
      content,
    }))
  })

  const [visibility, setVisibility] = useState<PostVisibility>(
    initialVisibility ?? "subscribers"
  )
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const overlayPinchStartDistanceRef = useRef<number | null>(null)
  const overlayPinchStartScaleRef = useRef<number | null>(null)

  function updateTextBlock(blockId: string, value: string) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, content: value } : block
      )
    )
  }

  function updateImageFilter(
    blockId: string,
    filter: "none" | "warm" | "cool" | "mono" | "vivid"
  ) {
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

  function ensureImageOverlayText(block: EditorBlock) {
    return {
      text: block.editorState?.image?.overlayText?.text ?? "",
      x: block.editorState?.image?.overlayText?.x ?? 0.5,
      y: block.editorState?.image?.overlayText?.y ?? 0.15,
      color: block.editorState?.image?.overlayText?.color ?? "#ffffff",
      fontSize: block.editorState?.image?.overlayText?.fontSize ?? "md",
      scale: block.editorState?.image?.overlayText?.scale ?? 1,
    } as const
  }

  function enableImageOverlayText(blockId: string) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block
        if (block.type !== "image") return block

        const overlay = ensureImageOverlayText(block)

        return {
          ...block,
          editorState: {
            ...block.editorState,
            image: {
              filter: block.editorState?.image?.filter ?? "none",
              overlayText: overlay,
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

        const overlay = ensureImageOverlayText(block)

        return {
          ...block,
          editorState: {
            ...block.editorState,
            image: {
              filter: block.editorState?.image?.filter ?? "none",
              overlayText: {
                ...overlay,
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

        const overlay = ensureImageOverlayText(block)

        return {
          ...block,
          editorState: {
            ...block.editorState,
            image: {
              filter: block.editorState?.image?.filter ?? "none",
              overlayText: {
                ...overlay,
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

    updateImageOverlayPositionFromClientPoint(
      blockId,
      event.clientX,
      event.clientY
    )

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

    const direction = event.deltaY < 0 ? 1 : -1

    const block = blocks.find((item) => item.id === blockId)
    if (!block || block.type !== "image") return

    const currentScale = block.editorState?.image?.overlayText?.scale ?? 1
    const nextScale = currentScale + direction * 0.08

    updateImageOverlayScale(blockId, nextScale)
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

        if (!startDistance || startDistance <= 0) {
          return
        }

        const currentDistance = getTouchDistance(touchA, touchB)
        const ratio = currentDistance / startDistance

        updateImageOverlayScale(blockId, startScale * ratio)
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

  function updateVideoTrimStart(blockId: string, trimStart: number) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block
        if (block.type !== "video") return block

        return {
          ...block,
          editorState: {
            ...block.editorState,
            video: {
              trimStart,
              trimEnd: block.editorState?.video?.trimEnd ?? null,
              muted: block.editorState?.video?.muted ?? true,
            },
          },
        }
      })
    )
  }

  function updateVideoTrimEnd(blockId: string, trimEnd: number | null) {
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
              trimEnd,
              muted: block.editorState?.video?.muted ?? true,
            },
          },
        }
      })
    )
  }

  function addTextBlock() {
    setBlocks((prev) => [
      ...prev,
      {
        id: createBlockId(),
        type: "text",
        content: "",
      },
    ])
  }

  function moveBlock(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return

    setBlocks((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  function moveBlockUp(index: number) {
    if (index === 0) return

    setBlocks((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveBlockDown(index: number) {
    setBlocks((prev) => {
      if (index === prev.length - 1) return prev

      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  function handleDragStart(blockId: string) {
    setDraggingBlockId(blockId)
  }

  function handleDragEnd() {
    setDraggingBlockId(null)
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
  }

  function handleDrop(targetBlockId: string) {
    if (!draggingBlockId || draggingBlockId === targetBlockId) {
      setDraggingBlockId(null)
      return
    }

    const fromIndex = blocks.findIndex((block) => block.id === draggingBlockId)
    const toIndex = blocks.findIndex((block) => block.id === targetBlockId)

    if (fromIndex === -1 || toIndex === -1) {
      setDraggingBlockId(null)
      return
    }

    moveBlock(fromIndex, toIndex)
    setDraggingBlockId(null)
  }

  function removeBlock(blockId: string) {
    setBlocks((prev) => {
      const next = prev.filter((block) => block.id !== blockId)
      return next.length > 0
        ? next
        : [{ id: createBlockId(), type: "text", content: "" }]
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function addMediaBlocks(nextFiles: File[]) {
    if (nextFiles.length === 0) return

    const nextBlocks: EditorBlock[] = nextFiles.map((file) => {
      const isVideo = file.type.startsWith("video/")

      return {
        id: createBlockId(),
        type: isVideo ? "video" : "image",
        file,
        previewUrl: URL.createObjectURL(file),
        editorState: isVideo
          ? createDefaultVideoEditorState()
          : createDefaultImageEditorState(),
      }
    })

    setBlocks((prev) => [...prev, ...nextBlocks])

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const submitBlocks: CreatePostBlockInput[] = blocks
      .filter((block) => {
        if (block.type === "text") {
          return (block.content ?? "").trim().length > 0
        }

        return Boolean(block.file || block.mediaId)
      })
      .map((block, index) => ({
        type: block.type,
        content: block.type === "text" ? block.content?.trim() ?? "" : null,
        sortOrder: index,
        mediaId: block.type !== "text" ? block.mediaId ?? null : null,
        editorState: block.editorState ?? null,
      }))

    const files = blocks
      .filter((block) => block.type !== "text" && block.file)
      .map((block) => block.file!)
      .filter((file) => file.size > 0)

    onSubmitPost({
      visibility,
      files,
      blocks: submitBlocks,
    })

    setBlocks([{ id: createBlockId(), type: "text", content: "" }])
    setVisibility("subscribers")
    setDraggingBlockId(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(block.id)}
            className={`space-y-3 rounded-[28px] border p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition ${
              draggingBlockId === block.id
                ? "border-pink-500/60 bg-zinc-900/80"
                : "border-zinc-800/80 bg-zinc-950/50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                {block.type === "text"
                  ? "Text block"
                  : block.type === "video"
                    ? "Video block"
                    : "Image block"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  draggable
                  onDragStart={() => handleDragStart(block.id)}
                  onDragEnd={handleDragEnd}
                  className="inline-flex h-9 w-9 cursor-grab items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm text-white transition hover:bg-zinc-800 active:cursor-grabbing"
                  aria-label="Drag block"
                  title="Drag block"
                >
                  ⋮⋮
                </button>

                <button
                  type="button"
                  onClick={() => moveBlockUp(index)}
                  disabled={index === 0}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:opacity-30"
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={() => moveBlockDown(index)}
                  disabled={index === blocks.length - 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:opacity-30"
                >
                  ↓
                </button>

                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                  aria-label="Remove block"
                >
                  ✕
                </button>
              </div>
            </div>

            {block.type === "text" ? (
              <textarea
                value={block.content ?? ""}
                onChange={(e) => updateTextBlock(block.id, e.target.value)}
                placeholder="Write a caption, tell a story, or set the mood for the next block..."
                className="min-h-[220px] w-full resize-none rounded-[24px] border border-pink-500/20 bg-white px-5 py-4 text-[17px] leading-8 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
                autoFocus={index === 0 && block.type === "text"}
              />
            ) : (
              <div className="group relative overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-900">
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="absolute right-3 top-3 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 group-hover:flex"
                >
                  ✕
                </button>

                <div
                  ref={block.type === "image" ? previewContainerRef : null}
                  className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-950"
                >
                  {block.type === "video" ? (
                    <video
                      src={block.previewUrl}
                      controls
                      muted={block.editorState?.video?.muted ?? true}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <img
                        src={block.previewUrl}
                        alt="Selected media"
                        style={getFilterStyle(block.editorState?.image?.filter)}
                        className="h-full w-full object-cover"
                      />

                      {block.editorState?.image?.overlayText?.text ? (
                        <div
                          onMouseDown={(event) =>
                            handleOverlayMouseDown(event, block.id)
                          }
                          onWheel={(event) => handleOverlayWheel(event, block.id)}
                          onTouchStart={(event) =>
                            handleOverlayTouchStart(event, block.id)
                          }
                          className="absolute z-10 max-w-[80%] cursor-grab select-none text-center active:cursor-grabbing"
                          style={{
                            left: `${block.editorState.image.overlayText.x * 100}%`,
                            top: `${block.editorState.image.overlayText.y * 100}%`,
                            transform: `translate(-50%, -50%) scale(${block.editorState.image.overlayText.scale ?? 1})`,
                            touchAction: "none",
                          }}
                        >
                          <p
                            className="whitespace-pre-wrap text-base font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]"
                            style={{
                              color: block.editorState.image.overlayText.color,
                            }}
                          >
                            {block.editorState.image.overlayText.text}
                          </p>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                {block.type === "image" ? (
                  <>
                    <div className="flex flex-wrap gap-2 border-t border-zinc-800 bg-zinc-950/80 p-3">
                      <button
                        type="button"
                        onClick={() => updateImageFilter(block.id, "none")}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          (block.editorState?.image?.filter ?? "none") === "none"
                            ? "bg-pink-600 text-white"
                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        None
                      </button>

                      <button
                        type="button"
                        onClick={() => updateImageFilter(block.id, "warm")}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          block.editorState?.image?.filter === "warm"
                            ? "bg-pink-600 text-white"
                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        Warm
                      </button>

                      <button
                        type="button"
                        onClick={() => updateImageFilter(block.id, "cool")}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          block.editorState?.image?.filter === "cool"
                            ? "bg-pink-600 text-white"
                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        Cool
                      </button>

                      <button
                        type="button"
                        onClick={() => updateImageFilter(block.id, "mono")}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          block.editorState?.image?.filter === "mono"
                            ? "bg-pink-600 text-white"
                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        Mono
                      </button>

                      <button
                        type="button"
                        onClick={() => updateImageFilter(block.id, "vivid")}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          block.editorState?.image?.filter === "vivid"
                            ? "bg-pink-600 text-white"
                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        Vivid
                      </button>
                    </div>

                    <div className="border-t border-zinc-800 bg-zinc-950/80 p-3 pt-0">
                      <div className="mt-3 space-y-3">
                        <button
                          type="button"
                          onClick={() => enableImageOverlayText(block.id)}
                          className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
                        >
                          Add Text
                        </button>

                        {block.editorState?.image?.overlayText ? (
                          <>
                            <input
                              type="text"
                              value={block.editorState.image.overlayText.text}
                              onChange={(event) =>
                                updateImageOverlayText(block.id, event.target.value)
                              }
                              placeholder="Write overlay text..."
                              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
                            />

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateImageOverlayColor(block.id, "#ffffff")
                                }
                                className="h-7 w-7 rounded-full border border-white/30 bg-white"
                                aria-label="White text"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateImageOverlayColor(block.id, "#f472b6")
                                }
                                className="h-7 w-7 rounded-full border border-white/10 bg-pink-400"
                                aria-label="Pink text"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateImageOverlayColor(block.id, "#fde047")
                                }
                                className="h-7 w-7 rounded-full border border-white/10 bg-yellow-300"
                                aria-label="Yellow text"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateImageOverlayColor(block.id, "#60a5fa")
                                }
                                className="h-7 w-7 rounded-full border border-white/10 bg-blue-400"
                                aria-label="Blue text"
                              />
                            </div>

                            <p className="text-xs text-zinc-500">
                              Drag to move. Pinch with two fingers or use the mouse wheel to resize.
                            </p>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : null}

                {block.type === "video" ? (
                  <div className="space-y-3 border-t border-zinc-800 bg-zinc-950/80 p-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateVideoMuted(
                          block.id,
                          !(block.editorState?.video?.muted ?? true)
                        )
                      }
                      className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
                    >
                      {(block.editorState?.video?.muted ?? true)
                        ? "Sound On"
                        : "Muted"}
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-1">
                        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                          Trim Start
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={block.editorState?.video?.trimStart ?? 0}
                          onChange={(event) =>
                            updateVideoTrimStart(
                              block.id,
                              Number(event.target.value) || 0
                            )
                          }
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                          Trim End
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={block.editorState?.video?.trimEnd ?? ""}
                          onChange={(event) =>
                            updateVideoTrimEnd(
                              block.id,
                              event.target.value === ""
                                ? null
                                : Number(event.target.value) || null
                            )
                          }
                          placeholder="End"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
                        />
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-[24px] border border-zinc-800/80 bg-zinc-950/50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as PostVisibility)}
            className="h-12 rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-white outline-none transition hover:bg-zinc-800 focus:border-pink-500"
          >
            <option value="public">Public</option>
            <option value="subscribers">Subscribers</option>
          </select>

          <button
            type="button"
            onClick={addTextBlock}
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-5 text-sm font-medium text-white transition hover:border-zinc-600 hover:bg-zinc-800"
          >
            Add text
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => {
              const nextFiles = Array.from(e.target.files ?? []).filter(
                (file) =>
                  file.type.startsWith("image/") || file.type.startsWith("video/")
              )

              addMediaBlocks(nextFiles)
            }}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-pink-500/30 bg-pink-500/10 text-lg text-pink-300 transition hover:bg-pink-500/20"
            aria-label="Upload files"
            title="Upload files"
          >
            +
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center rounded-full bg-pink-600 px-6 text-sm font-semibold text-white transition hover:bg-pink-500 disabled:opacity-50"
        >
          {isSubmitting ? "Publishing..." : "Publish"}
        </button>
      </div>
    </form>
  )
}