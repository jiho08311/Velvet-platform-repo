"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { StoryVideoTrimField } from "@/modules/media/ui/StoryVideoTrimField"
import { Button } from "@/shared/ui/Button"
import type {
  CreatePostCarouselItem,
  CreatePostClientDraftBlock,
  CreatePostClientCarouselItem,
  CreatePostClientDraftMediaSource,
  CreatePostUploadedMediaInput,
  NormalizedPostEditorBlock,
  NormalizedPostEditorMediaSource,
  PostVisibility,
  PostBlockEditorState,
} from "@/modules/post/types"
import {
  getComposerControlButtonClassName,
  getComposerControlClassName,
  getComposerMinorCTAClassName,
  resolveComposerToolChipClassName,
  resolveCreatePostSubmitCTA,
} from "./post-composer-ui-state"

type PublishMode = "now" | "scheduled"

type SubmitPostInput = {
  visibility: PostVisibility
  publishMode: PublishMode
  publishedAt: string | null
  blocks: CreatePostClientDraftBlock[]
  uploadedFiles: Record<string, File>
}

type CreatePostFormProps = {
  isSubmitting?: boolean
  onSubmitPost: (input: SubmitPostInput) => void
  initialTextBlocks?: string[]
  initialVisibility?: PostVisibility
  initialBlocks?: NormalizedPostEditorBlock<CreatePostUploadedMediaInput>[]
  visibilityOptions?: PostVisibility[]
  showPublishMode?: boolean
  submitLabel?: string
  resetAfterSubmit?: boolean
}

type CarouselEditorItem = {
  id: string
  type: CreatePostCarouselItem["type"]
  media: CreatePostClientDraftMediaSource
  file?: File
  previewUrl?: string
  editorState?: PostBlockEditorState
}

type EditorTextBlock = Extract<CreatePostClientDraftBlock, { type: "text" }> & {
  id: string
}

type EditorMediaBlock = Extract<
  CreatePostClientDraftBlock,
  { type: "image" | "video" | "audio" | "file" }
> & {
  id: string
  file?: File
  previewUrl?: string
}

type EditorCarouselBlock = {
  id: string
  type: "carousel"
  sortOrder: number
  items: CarouselEditorItem[]
  editorState?: null
  content?: null
}

type EditorBlock =
  | EditorTextBlock
  | EditorMediaBlock
  | EditorCarouselBlock

const FILTER_PRESETS = ["none", "warm", "cool", "mono", "vivid"] as const
type PostFilterPreset = (typeof FILTER_PRESETS)[number]
const FILTER_SWIPE_THRESHOLD = 40

function createBlockId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function createCarouselBlock(items: CarouselEditorItem[] = []): EditorBlock {
  return {
    id: createBlockId(),
    type: "carousel",
    sortOrder: 0,
    items,
    editorState: null,
  }
}

function createUploadedPlaceholderId(file: File) {
  return `create-upload:${file.name}:${file.size}:${file.lastModified}:${file.type}`
}

function createUploadedMediaSource(
  file: File,
  type: CreatePostCarouselItem["type"]
): CreatePostClientDraftMediaSource {
  return {
    kind: "uploaded",
    uploaded: {
      placeholderId: createUploadedPlaceholderId(file),
      type,
      mimeType: file.type || "",
      size: file.size,
      originalName: file.name,
    },
  }
}

function createClientUploadedMediaSourceFromDraft(
  uploaded: CreatePostUploadedMediaInput
): CreatePostClientDraftMediaSource {
  return {
    kind: "uploaded",
    uploaded: {
      ...uploaded,
      placeholderId: uploaded.path,
    },
  }
}

function createClientDraftMediaSourceFromNormalizedSource(
  media: NormalizedPostEditorMediaSource<CreatePostUploadedMediaInput>
): CreatePostClientDraftMediaSource {
  if (media.kind === "existing") {
    return {
      kind: "existing",
      mediaId: media.mediaId,
    }
  }

  return createClientUploadedMediaSourceFromDraft(media.uploaded)
}

function normalizeEditorBlocks(blocks: EditorBlock[]): EditorBlock[] {
  return blocks.map((block, index) => ({
    ...block,
    sortOrder: index,
  }))
}

function createEditorTextBlockFromDraft(
  block: Extract<
    NormalizedPostEditorBlock<CreatePostUploadedMediaInput>,
    { type: "text" }
  >
): EditorTextBlock {
  return {
    id: createBlockId(),
    type: "text",
    sortOrder: block.sortOrder,
    content: block.content ?? "",
    editorState: block.editorState ?? null,
  }
}

function createEditorCarouselItemFromDraft(
  item: CreatePostCarouselItem
): CarouselEditorItem {
  return {
    id: createBlockId(),
    type: item.type,
    previewUrl: undefined,
    media: createClientDraftMediaSourceFromNormalizedSource(item.media),
    file: undefined,
    editorState: item.editorState ?? null,
  }
}

function createEditorMediaBlockFromDraft(
  block: Extract<
    NormalizedPostEditorBlock<CreatePostUploadedMediaInput>,
    { type: "image" | "video" | "audio" | "file" }
  >
): EditorMediaBlock {
  return {
    id: createBlockId(),
    type: block.type,
    sortOrder: block.sortOrder,
    previewUrl: undefined,
    media: createClientDraftMediaSourceFromNormalizedSource(block.media),
    file: undefined,
    editorState: block.editorState ?? null,
    content: null,
  }
}

function createEditorBlockFromNormalizedDraft(
  block: NormalizedPostEditorBlock<CreatePostUploadedMediaInput>
): EditorBlock {
  if (block.type === "text") {
    return createEditorTextBlockFromDraft(block)
  }

  if (block.type === "carousel") {
    return {
      id: createBlockId(),
      type: "carousel",
      sortOrder: block.sortOrder,
      items: block.items.map(createEditorCarouselItemFromDraft),
      editorState: null,
    }
  }

  return createEditorMediaBlockFromDraft(block)
}

function createInitialEditorBlocks(params: {
  initialBlocks?: NormalizedPostEditorBlock<CreatePostUploadedMediaInput>[]
  initialTextBlocks?: string[]
}): EditorBlock[] {
  if (params.initialBlocks && params.initialBlocks.length > 0) {
    return normalizeEditorBlocks(
      params.initialBlocks.map(createEditorBlockFromNormalizedDraft)
    )
  }

  return normalizeEditorBlocks(
    (params.initialTextBlocks ?? [""]).map(
      (content): EditorBlock => ({
        id: createBlockId(),
        type: "text",
        sortOrder: 0,
        content,
        editorState: undefined,
      })
    )
  )
}

function createSerializedUploadedMediaSource(params: {
  placeholderId: string
  type: CreatePostCarouselItem["type"]
  file: File
}): CreatePostClientDraftMediaSource {
  return {
    kind: "uploaded",
    uploaded: {
      placeholderId: params.placeholderId,
      type: params.type,
      mimeType: params.file.type || "",
      size: params.file.size,
      originalName: params.file.name,
    },
  }
}

function clampPosition(value: number) {
  return Math.min(0.98, Math.max(0.02, value))
}

function clampScale(value: number) {
  return Math.min(6, Math.max(0.8, value))
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

const [activeMediaToolByBlock, setActiveMediaToolByBlock] = useState<
  Record<string, "text" | "filter" | "trim" | null>
>({})

const fileInputRef = useRef<HTMLInputElement | null>(null)
const carouselFileInputRef = useRef<HTMLInputElement | null>(null)
const pendingCarouselBlockIdRef = useRef<string | null>(null)
  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const overlayPinchStartDistanceRef = useRef<number | null>(null)
  const overlayPinchStartScaleRef = useRef<number | null>(null)
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


  function getActiveMediaTool(blockId: string) {
  return activeMediaToolByBlock[blockId] ?? null
}

function setActiveMediaTool(
  blockId: string,
  tool: "text" | "filter" | "trim" | null
) {
  setActiveMediaToolByBlock((prev) => ({
    ...prev,
    [blockId]: tool,
  }))
}

  function updateTextBlock(blockId: string, value: string) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId && block.type === "text"
          ? { ...block, content: value }
          : block
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

    if (startX === null) {
      return
    }

    const deltaX = clientX - startX
    const clampedOffset = Math.max(-18, Math.min(18, deltaX * 0.18))

    setFilterSwipeOffsetX(clampedOffset)

    if (filterSwipeTriggeredRef.current) {
      return
    }

    if (Math.abs(deltaX) < FILTER_SWIPE_THRESHOLD) {
      return
    }

    filterSwipeTriggeredRef.current = true

    if (deltaX < 0) {
      moveImageFilterBy(blockId, currentPreset, "next")
    } else {
      moveImageFilterBy(blockId, currentPreset, "prev")
    }
  }

  function resetFilterSwipe() {
    filterSwipeStartXRef.current = null
    filterSwipeTriggeredRef.current = false
    setFilterSwipeOffsetX(0)
  }

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
    const nextScale = currentScale + direction * 0.12

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

        const trimStart = nextTrim.startTime
        const trimEnd = nextTrim.requiresTrim
          ? nextTrim.startTime + nextTrim.duration
          : null

        return {
          ...block,
          editorState: {
            ...block.editorState,
            video: {
              trimStart,
              trimEnd,
              muted: block.editorState?.video?.muted ?? true,
            },
          },
        }
      })
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

  function addCarouselBlock() {
    setBlocks((prev) => normalizeEditorBlocks([...prev, createCarouselBlock()]))
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


  function removeCarouselItem(blockId: string, itemId: string) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.type !== "carousel") return block
        if (block.id !== blockId) return block

        return {
          ...block,
          items: block.items.filter((item) => item.id !== itemId),
        }
      })
    )
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



type SerializedEditorSubmitResult = {
  blocks: CreatePostClientDraftBlock[]
  uploadedFiles: Record<string, File>
}

function hasExistingMediaSource(
  media: CreatePostClientDraftMediaSource
): media is Extract<CreatePostClientDraftMediaSource, { kind: "existing" }> {
  return media.kind === "existing" && (media.mediaId?.trim() ?? "").length > 0
}

function hasUploadedMediaFile(params: {
  media: CreatePostClientDraftMediaSource
  file?: File
}): params is {
  media: Extract<CreatePostClientDraftMediaSource, { kind: "uploaded" }>
  file: File
} {
  return params.media.kind === "uploaded" && Boolean(params.file && params.file.size > 0)
}

function serializeMediaSourceForSubmit(params: {
  type: CreatePostClientCarouselItem["type"]
  media: CreatePostClientDraftMediaSource
  file?: File
  uploadedFiles: Record<string, File>
}): CreatePostClientCarouselItem | null {
  if (hasExistingMediaSource(params.media)) {
    return {
      type: params.type,
      media: params.media,
    }
  }

  if (!hasUploadedMediaFile({ media: params.media, file: params.file })) {
    return null
  }

  const placeholderId = params.media.uploaded.placeholderId
  const uploadedFile = params.file

  if (!uploadedFile) {
    return null
  }

  params.uploadedFiles[placeholderId] = uploadedFile

  return {
    type: params.type,
    media: createSerializedUploadedMediaSource({
      placeholderId,
      type: params.type,
      file: uploadedFile,
    }),
  }
}

function serializeEditorBlocksForSubmit(
  blocks: EditorBlock[]
): SerializedEditorSubmitResult {
  const uploadedFiles: Record<string, File> = {}

  const serializedBlocks = blocks.flatMap(
    (block): CreatePostClientDraftBlock[] => {
      if (block.type === "text") {
        const content = block.content?.trim() ?? ""

        if (!content) {
          return []
        }

        return [
          {
            type: "text",
            content,
            sortOrder: block.sortOrder,
            editorState: block.editorState ?? null,
          },
        ]
      }

      if (block.type === "carousel") {
        const carouselGroupId = block.id

        const items = block.items.flatMap(
          (item, itemIndex): CreatePostClientCarouselItem[] => {
            const serializedItem = serializeMediaSourceForSubmit({
              type: item.type,
              media: item.media,
              file: item.file,
              uploadedFiles,
            })

            if (!serializedItem) {
              return []
            }

            const nextEditorState = {
              ...(serializedItem.editorState ?? item.editorState ?? null),
              carousel: {
                groupId: carouselGroupId,
                index: itemIndex,
                size: block.items.length,
              },
            }

            return [
              {
                ...serializedItem,
                editorState: nextEditorState,
              },
            ]
          }
        )

        if (items.length === 0) {
          return []
        }

        return [
          {
            type: "carousel",
            sortOrder: block.sortOrder,
            items,
            editorState: null,
          },
        ]
      }

      const serializedMedia = serializeMediaSourceForSubmit({
        type: block.type,
        media: block.media,
        file: block.file,
        uploadedFiles,
      })

      if (!serializedMedia) {
        return []
      }

      return [
        {
          ...serializedMedia,
          sortOrder: block.sortOrder,
          editorState: block.editorState ?? null,
        },
      ]
    }
  ).sort((a, b) => a.sortOrder - b.sortOrder)

  return {
    blocks: serializedBlocks,
    uploadedFiles,
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
      setActiveMediaToolByBlock({})
      setShowFilterIndicator(false)
      setFilterSwipeOffsetX(0)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        {blocks.map((block, index) => (
        <div
  key={block.id}
  onDragOver={(event) => handleDragOver(event, block.id)}
  onDrop={() => handleDrop(block.id)}
  onDragLeave={() => {
  if (dropTargetBlockId === block.id) {
    setDropTargetBlockId(null)
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
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm text-white transition hover:bg-zinc-800 ${
  draggingBlockId === block.id
    ? "cursor-grabbing"
    : "cursor-grab active:cursor-grabbing"
}`}
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
            ) : block.type === "carousel" ? (
              <div className="space-y-3 rounded-[24px] border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">
                    Carousel items
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      pendingCarouselBlockIdRef.current = block.id
                      carouselFileInputRef.current?.click()
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
                  >
                    Add media
                  </button>
                </div>

                {block.items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-8 text-center text-sm text-zinc-400">
                    No carousel items yet
                  </div>
                ) : (
             

<div className="relative w-full overflow-hidden rounded-2xl">
<div
  ref={(el) => {
    if (!el) return

    el.onscroll = () => {
      const scrollLeft = el.scrollLeft
      const width = el.clientWidth
      const index = Math.round(scrollLeft / width)

      el.setAttribute("data-index", String(index))
    }
  }}
  data-index="0"
  className="flex snap-x snap-mandatory overflow-x-auto"
>
    {block.items.map((item) => (
      <div key={item.id} className="w-full shrink-0 snap-center">
        <div className="aspect-[4/5] w-full overflow-hidden bg-zinc-950">
          {item.type === "video" ? (
            <video
              src={item.previewUrl}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={item.previewUrl}
              alt="Carousel item"
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </div>
    ))}
  </div>

  {/* indicator */}
  {block.items.length > 1 && (
 <div
  className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5"
  ref={(container) => {
    if (!container) return

    const parent = container.parentElement
    if (!parent) return

    const scrollEl = parent.querySelector('[data-index]')
    if (!scrollEl) return

    const updateDots = () => {
      const index = Number(scrollEl.getAttribute("data-index") ?? "0")

      container.querySelectorAll("[data-dot-index]").forEach((dot, i) => {
        dot.className =
          "h-1.5 w-1.5 rounded-full " +
          (i === index ? "bg-[#C2185B]" : "bg-white/30")
      })
    }

    scrollEl.addEventListener("scroll", updateDots)
    updateDots()
  }}
>
  {block.items.map((_, index) => (
  <span
    key={index}
    className="h-1.5 w-1.5 rounded-full bg-white/30"
    data-dot-index={index}
  />
))}
    </div>
  )}
</div>



                )}
              </div>
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
                  onTouchStart={(event) => {
                    if (block.type !== "image") return
                    if (getActiveMediaTool(block.id) !== "filter") return

                    handleFilterSwipeStart(event.touches[0]?.clientX ?? 0)
                  }}
                  onTouchMove={(event) => {
                    if (block.type !== "image") return
                    if (getActiveMediaTool(block.id) !== "filter") return

                    handleFilterSwipeMove(
                      event.touches[0]?.clientX ?? 0,
                      block.id,
                      (block.editorState?.image?.filter ?? "none") as PostFilterPreset
                    )
                  }}
                  onTouchEnd={() => {
                    if (block.type !== "image") return
                    if (getActiveMediaTool(block.id) !== "filter") return

                    resetFilterSwipe()
                  }}
                  onTouchCancel={() => {
                    if (block.type !== "image") return
                    if (getActiveMediaTool(block.id) !== "filter") return

                    resetFilterSwipe()
                  }}
                  onMouseDown={(event) => {
                    if (block.type !== "image") return
                    if (getActiveMediaTool(block.id) !== "filter") return

                    handleFilterSwipeStart(event.clientX)
                  }}
                  onMouseMove={(event) => {
                    if (block.type !== "image") return
                    if (getActiveMediaTool(block.id) !== "filter") return
                    if ((event.buttons & 1) !== 1) return

                    handleFilterSwipeMove(
                      event.clientX,
                      block.id,
                      (block.editorState?.image?.filter ?? "none") as PostFilterPreset
                    )
                  }}
                  onMouseUp={() => {
                    if (block.type !== "image") return
                    if (getActiveMediaTool(block.id) !== "filter") return

                    resetFilterSwipe()
                  }}
                  className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-950"
                >
                  {block.type === "video" ? (
                    <video
                      src={block.previewUrl}
                      autoPlay
                      loop
                      playsInline
                      muted={block.editorState?.video?.muted ?? true}
                      preload="metadata"
                      onLoadedMetadata={(event) => {
                        const trimStart = block.editorState?.video?.trimStart ?? 0
                        if (trimStart > 0) {
                          event.currentTarget.currentTime = trimStart
                        }
                      }}
                      onTimeUpdate={(event) => {
                        const video = event.currentTarget
                        const trimStart = block.editorState?.video?.trimStart ?? 0
                        const trimEnd = block.editorState?.video?.trimEnd ?? null

                        if (trimStart > 0 && video.currentTime < trimStart) {
                          video.currentTime = trimStart
                        }

                        if (
                          trimEnd !== null &&
                          trimEnd > trimStart &&
                          video.currentTime >= trimEnd
                        ) {
                          video.currentTime = trimStart
                          void video.play()
                        }
                      }}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <div
                        className="absolute inset-0"
                        style={{
                          transform: `translateX(${filterSwipeOffsetX}px)`,
                          transition:
                            filterSwipeStartXRef.current === null
                              ? "transform 180ms ease-out"
                              : "none",
                          willChange: "transform",
                        }}
                      >
                        <img
                          src={block.previewUrl}
                          alt="Selected media"
                          style={getFilterStyle(block.editorState?.image?.filter)}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {block.editorState?.image?.overlayText?.text ? (
                        <div
                          onMouseDown={(event) => {
                            if (getActiveMediaTool(block.id) !== "text") return
                            handleOverlayMouseDown(event, block.id)
                          }}
                          onWheel={(event) => {
                            if (getActiveMediaTool(block.id) !== "text") return
                            handleOverlayWheel(event, block.id)
                          }}
                          onTouchStart={(event) => {
                            if (getActiveMediaTool(block.id) !== "text") return
                            handleOverlayTouchStart(event, block.id)
                          }}
                          className={`absolute z-10 max-w-[80%] select-none text-center ${
                            getActiveMediaTool(block.id) === "text"
                              ? "cursor-grab active:cursor-grabbing"
                              : "pointer-events-none"
                          }`}
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

                      {getActiveMediaTool(block.id) === "filter" && showFilterIndicator ? (
                        <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-zinc-200 bg-white/90 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-black backdrop-blur-sm">
                          {block.editorState?.image?.filter ?? "none"}
                        </div>
                      ) : null}

                      {getActiveMediaTool(block.id) === "filter" && !showFilterIndicator ? (
                        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-[11px] text-zinc-400 opacity-80">
                          Swipe
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                {block.type === "image" ? (
                  <div className="border-t border-zinc-800 bg-zinc-950/80 p-3 pt-0">
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            enableImageOverlayText(block.id)
                            setActiveMediaTool(block.id, "text")
                          }}
                          className={resolveComposerToolChipClassName(
                            getActiveMediaTool(block.id) === "text"
                          )}
                        >
                          Text
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveMediaTool(block.id, "filter")}
                          className={resolveComposerToolChipClassName(
                            getActiveMediaTool(block.id) === "filter"
                          )}
                        >
                          Filter
                        </button>

<button
  type="button"
  onClick={() => {
    pendingCarouselBlockIdRef.current = block.id
    carouselFileInputRef.current?.click()
  }}
  className={getComposerMinorCTAClassName()}
>
  +
</button>




                      </div>

                      {block.editorState?.image?.overlayText &&
                      getActiveMediaTool(block.id) === "text" ? (
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
                            {[
                              "#FFFFFF",
                              "#000000",
                              "#FF0000",
                              "#00FF00",
                              "#0000FF",
                              "#FFFF00",
                              "#FF00FF",
                              "#00FFFF",
                              "#FFA500",
                              "#800080",
                            ].map((color) => {
                              const isActive =
                                (block.editorState?.image?.overlayText?.color ?? "#ffffff") === color

                              return (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => updateImageOverlayColor(block.id, color)}
                                  className={`h-8 w-8 rounded-full border transition ${
                                    isActive
                                      ? "border-white scale-110"
                                      : "border-zinc-600 hover:scale-105"
                                  }`}
                                  style={{ backgroundColor: color }}
                                  aria-label={`Select color ${color}`}
                                />
                              )
                            })}
                          </div>

                          <p className="text-xs text-zinc-500">
                            Drag text to move. Pinch or wheel to resize.
                          </p>
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {block.type === "video" ? (
                  <div className="space-y-3 border-t border-zinc-800 bg-zinc-950/80 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveMediaTool(block.id, "trim")}
                        className={resolveComposerToolChipClassName(
                          getActiveMediaTool(block.id) === "trim"
                        )}
                      >
                        Trim
                      </button>












<button
  type="button"
  onClick={() => {
    pendingCarouselBlockIdRef.current = block.id
    carouselFileInputRef.current?.click()
  }}
  className={getComposerMinorCTAClassName()}
>
  +
</button>



                      <button
                        type="button"
                        onClick={() =>
                          updateVideoMuted(
                            block.id,
                            !(block.editorState?.video?.muted ?? true)
                          )
                        }
                        className={getComposerMinorCTAClassName()}
                      >
                        {(block.editorState?.video?.muted ?? true)
                          ? "Sound On"
                          : "Muted"}
                      </button>
                    </div>

                    {getActiveMediaTool(block.id) === "trim" ? (
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                        <StoryVideoTrimField
                          file={block.file ?? null}
                          onChange={(nextTrim) =>
                            handleVideoTrimChange(block.id, nextTrim)
                          }
                        />
                      </div>
                    ) : null}
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
            className={getComposerControlClassName()}
          >
            {visibilityOptions.map((option) => (
              <option key={option} value={option}>
                {option === "public"
                  ? "Public"
                  : option === "subscribers"
                    ? "Subscribers"
                    : "Paid"}
              </option>
            ))}
          </select>

{showPublishMode ? (
  <>
    <select
      value={publishMode}
      onChange={(e) => setPublishMode(e.target.value as PublishMode)}
      className={getComposerControlClassName()}
    >
      <option value="now">Publish now</option>
      <option value="scheduled">Schedule</option>
    </select>

    {publishMode === "scheduled" ? (
      <input
        type="datetime-local"
        value={publishedAt}
        onChange={(e) => setPublishedAt(e.target.value)}
        className={getComposerControlClassName()}
      />
    ) : null}
  </>
) : null}

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

<input
  ref={carouselFileInputRef}
  type="file"
  multiple
  accept="image/*,video/*"
  onChange={(e) => {
    const blockId = pendingCarouselBlockIdRef.current
    const nextFiles = Array.from(e.target.files ?? []).filter(
      (file) =>
        file.type.startsWith("image/") || file.type.startsWith("video/")
    )

    if (blockId) {
      addCarouselItems(blockId, nextFiles)
    }

    pendingCarouselBlockIdRef.current = null
  }}
  className="hidden"
/>



<button
  type="button"
  onClick={addTextBlock}
  className={getComposerControlButtonClassName()}
>
  Text
</button>




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

        <Button
          type="submit"
          disabled={submitCTA.disabled}
          className="min-h-[48px] bg-pink-600 px-6 hover:bg-pink-500"
        >
          {submitCTA.label}
        </Button>
      </div>
    </form>
  )
}
