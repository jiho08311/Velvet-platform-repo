"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { StoryVideoTrimField } from "@/modules/media/ui/StoryVideoTrimField"
import {
  createEmptyStoryEditorState,
  createEmptyStoryVideoTrim,
  getStoryMediaTypeFromFile,
  normalizeStoryEditorDraft,
} from "../lib/story-editor-draft"
import type {
  StoryEditorDraft,
  StoryEditorState,
  StoryEditorTool,
  StoryEditorUiState,
  StoryMusic,
  StoryMusicSearchItem,
} from "../types"

type CreateStoryFormProps = {
  isSubmitting?: boolean
  onNextStory: (input: StoryEditorDraft) => void
}

type StoryTool = Extract<StoryEditorTool, "text" | "music" | "filter" | "trim">
type StoryMusicStyle = NonNullable<StoryMusic["style"]>

const STORY_TOOL_CONTROLS: {
  tool: StoryTool
  icon: string
  label: string
}[] = [
  { tool: "music", icon: "♫", label: "오디오" },
  { tool: "text", icon: "Aa", label: "텍스트" },
  { tool: "filter", icon: "◌", label: "필터" },
  { tool: "trim", icon: "🎬", label: "영상 편집" },
]

const MUSIC_STYLE_CONTROLS: {
  style: StoryMusicStyle
  label: string
}[] = [
  { style: "default", label: "Default" },
  { style: "minimal", label: "Minimal" },
  { style: "bold", label: "Bold" },
]

const TEXT_COLOR_SWATCHES = [
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
]

const TOOL_HELP_CARD_CLASS =
  "rounded-[18px] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500"
const TOOL_HELP_CARD_LOOSE_CLASS =
  "rounded-[18px] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500"
const TOOL_SHEET_ACTION_BUTTON_CLASS =
  "rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-black transition hover:bg-zinc-100"
const TOOL_SHEET_PANEL_CLASS =
  "space-y-5 rounded-[24px] border border-zinc-200 bg-white p-5"
const TOOL_SHEET_COMPACT_PANEL_CLASS =
  "space-y-4 rounded-[24px] border border-zinc-200 bg-white p-5"
const TOOL_SHEET_RAISED_PANEL_CLASS =
  "space-y-5 rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm"
const TOOL_SHEET_TRIM_PANEL_CLASS =
  "rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm"

const FILTER_PRESETS = ["none", "warm", "cool", "mono", "vivid"] as const
type StoryFilterPreset = (typeof FILTER_PRESETS)[number]
const FILTER_SWIPE_THRESHOLD = 40

function getStoryToolControlClassName(isActive: boolean) {
  return `flex h-[72px] min-w-[72px] shrink-0 flex-col items-center justify-center rounded-[22px] border px-3 transition-all ${
    isActive
      ? "border-zinc-300 bg-white text-black shadow-sm"
      : "border-zinc-200 bg-white text-black backdrop-blur-xl"
  }`
}

function getMusicStyleControlClassName(isActive: boolean) {
  return `rounded-xl border px-3 py-2 text-xs font-medium transition ${
    isActive
      ? "border-pink-500 bg-pink-500/10 text-black"
      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
  }`
}

function clampPosition(value: number) {
  return Math.min(0.98, Math.max(0.02, value))
}

function getFilterStyle(preset?: string | null) {
  if (preset === "warm") {
    return { filter: "sepia(0.35) saturate(1.15) brightness(1.05)" }
  }

  if (preset === "cool") {
    return { filter: "saturate(0.9) hue-rotate(12deg) brightness(1.02)" }
  }

  if (preset === "mono") {
    return { filter: "grayscale(1) contrast(1.05)" }
  }

  if (preset === "vivid") {
    return { filter: "saturate(1.35) contrast(1.08)" }
  }

  return { filter: "none" }
}

export function CreateStoryForm({
  isSubmitting = false,
  onNextStory,
}: CreateStoryFormProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [musicQuery, setMusicQuery] = useState("")
  const [musicResults, setMusicResults] = useState<StoryMusicSearchItem[]>([])
  const [isSearchingMusic, setIsSearchingMusic] = useState(false)
  const [editorState, setEditorState] = useState<StoryEditorState>(
    createEmptyStoryEditorState()
  )
  const [uiState, setUiState] = useState<StoryEditorUiState>({
    activeTool: null,
    selectedLayer: null,
    isPreviewMode: false,
    isDragging: false,
    isToolSheetOpen: false,
  })

  const [trim, setTrim] = useState(createEmptyStoryVideoTrim())

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const filterSwipeStartXRef = useRef<number | null>(null)
  const filterSwipeTriggeredRef = useRef(false)
  const filterIndicatorTimeoutRef = useRef<number | null>(null)
  const [showFilterIndicator, setShowFilterIndicator] = useState(false)
  const [filterSwipeOffsetX, setFilterSwipeOffsetX] = useState(0)
  const textPinchStartDistanceRef = useRef<number | null>(null)
  const textPinchStartScaleRef = useRef<number | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  const selectedLayer = uiState.selectedLayer

  const selectedTextOverlay =
    selectedLayer?.type === "text"
      ? (editorState.textOverlays ?? []).find(
          (overlay) => overlay.id === selectedLayer.id
        ) ?? null
      : null

  const isMusicSelected = selectedLayer?.type === "music"

  const selectedFilterPreset = editorState.filter?.preset ?? "none"
  const selectedMusic = editorState.music
  const selectedMusicStyle = selectedMusic?.style ?? "default"

  useEffect(() => {
    return () => {
      if (filterIndicatorTimeoutRef.current) {
        window.clearTimeout(filterIndicatorTimeoutRef.current)
      }
    }
  }, [])

  const activeTool = uiState.activeTool
  const isTextToolOpen = activeTool === "text"
  const isMusicToolOpen = activeTool === "music"
  const isFilterToolOpen = activeTool === "filter"
  const isTrimToolOpen = activeTool === "trim"
  const isToolSheetOpen = uiState.isToolSheetOpen

  useEffect(() => {
    const query = musicQuery.trim()

    if (!query) {
      setMusicResults([])
      setIsSearchingMusic(false)
      return
    }

    const timeout = window.setTimeout(async () => {
      try {
        setIsSearchingMusic(true)

        const res = await fetch(
          `/api/story/music/search?q=${encodeURIComponent(query)}`
        )

        if (!res.ok) {
          setMusicResults([])
          return
        }

        const data = (await res.json()) as {
          items?: StoryMusicSearchItem[]
        }

        setMusicResults(data.items ?? [])
      } catch {
        setMusicResults([])
      } finally {
        setIsSearchingMusic(false)
      }
    }, 300)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [musicQuery])

  function closeToolSheet() {
    setUiState((prev) => ({
      ...prev,
      isToolSheetOpen: false,
    }))
  }

  function handleOpenTool(tool: StoryTool) {
    setUiState((prev) => ({
      ...prev,
      activeTool: tool,
      isToolSheetOpen: true,
    }))
  }

  function handleAddTextOverlay() {
    const nextId = crypto.randomUUID()

    setEditorState((prev) => {
      if ((prev.textOverlays?.length ?? 0) > 0) {
        return prev
      }

      return {
        ...prev,
        textOverlays: [
          {
            id: nextId,
            text: "",
            x: 0.5,
            y: 0.2,
            color: "#ffffff",
            fontSize: "md",
            scale: 2,
          },
        ],
      }
    })

    setUiState((prev) => ({
      ...prev,
      activeTool: "text",
      isToolSheetOpen: true,
      selectedLayer: {
        type: "text",
        id: nextId,
      },
    }))
  }

  function handleOverlayTextChange(value: string) {
    setEditorState((prev) => {
      const current = prev.textOverlays ?? []

      if (selectedLayer?.type !== "text") {
        return prev
      }

      return {
        ...prev,
        textOverlays: current.map((overlay) =>
          overlay.id === selectedLayer.id
            ? {
                ...overlay,
                text: value,
              }
            : overlay
        ),
      }
    })
  }

  function handleChangeTextOverlayFontSize(fontSize: "sm" | "md" | "lg") {
    setEditorState((prev) => {
      if (selectedLayer?.type !== "text") {
        return prev
      }

      return {
        ...prev,
        textOverlays: (prev.textOverlays ?? []).map((overlay) =>
          overlay.id === selectedLayer.id
            ? {
                ...overlay,
                fontSize,
              }
            : overlay
        ),
      }
    })
  }

  function handleChangeTextOverlayColor(color: string) {
    setEditorState((prev) => {
      if (selectedLayer?.type !== "text") {
        return prev
      }

      return {
        ...prev,
        textOverlays: (prev.textOverlays ?? []).map((overlay) =>
          overlay.id === selectedLayer.id
            ? {
                ...overlay,
                color,
              }
            : overlay
        ),
      }
    })
  }

  function handleRemoveTextOverlay() {
    setEditorState((prev) => {
      if (selectedLayer?.type !== "text") {
        return prev
      }

      return {
        ...prev,
        textOverlays: (prev.textOverlays ?? []).filter(
          (overlay) => overlay.id !== selectedLayer.id
        ),
      }
    })

    setUiState((prev) => ({
      ...prev,
      selectedLayer: null,
    }))
  }

  function handleChangeFilter(
    preset: "none" | "warm" | "cool" | "mono" | "vivid"
  ) {
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
    const currentIndex = FILTER_PRESETS.indexOf(
      selectedFilterPreset as StoryFilterPreset
    )

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
    if (!previewUrl || uiState.isDragging || activeTool !== "filter") {
      return
    }

    filterSwipeStartXRef.current = clientX
    filterSwipeTriggeredRef.current = false
    setFilterSwipeOffsetX(0)
  }

  function handleFilterSwipeMove(clientX: number) {
    if (!previewUrl || uiState.isDragging || activeTool !== "filter") {
      return
    }

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
      moveFilterBy("next")
    } else {
      moveFilterBy("prev")
    }
  }

  function resetFilterSwipe() {
    filterSwipeStartXRef.current = null
    filterSwipeTriggeredRef.current = false
    setFilterSwipeOffsetX(0)
  }

  function handleSelectMusic(option: {
    source: "external"
    trackId: string
    title: string
    artist: string
    previewUrl?: string | null
    artworkUrl?: string | null
    duration?: number | null
  }) {
    setEditorState((prev) => ({
      ...prev,
      music: {
        source: option.source,
        trackId: option.trackId,
        title: option.title,
        artist: option.artist,
        artworkUrl: option.artworkUrl ?? null,
        previewUrl: option.previewUrl ?? null,
        startTime: 0,
        duration: option.duration ?? 30,
        volume: 1,
        x: 0.5,
        y: 0.5,
        style: prev.music?.style ?? "default",
      },
    }))

    setUiState((prev) => ({
      ...prev,
      activeTool: "music",
      isToolSheetOpen: true,
      selectedLayer: {
        type: "music",
        id: "music",
      },
    }))
  }

  function updateMusicPositionFromClientPoint(clientX: number, clientY: number) {
    const container = previewContainerRef.current

    if (!container) {
      return
    }

    const rect = container.getBoundingClientRect()
    const nextX = clampPosition((clientX - rect.left) / rect.width)
    const nextY = clampPosition((clientY - rect.top) / rect.height)

    setEditorState((prev) => {
      if (!prev.music) {
        return prev
      }

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

  function updateTextOverlayPositionFromClientPoint(
    overlayId: string,
    clientX: number,
    clientY: number
  ) {
    const container = previewContainerRef.current

    if (!container) {
      return
    }

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

  function getTouchDistance(
    touchA: { clientX: number; clientY: number },
    touchB: { clientX: number; clientY: number }
  ) {
    const dx = touchA.clientX - touchB.clientX
    const dy = touchA.clientY - touchB.clientY
    return Math.sqrt(dx * dx + dy * dy)
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

    if (activeTool !== "text") {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const overlayId = event.currentTarget.dataset.overlayId

    if (!overlayId) {
      return
    }

    const safeOverlayId = overlayId

    setUiState((prev) => ({
      ...prev,
      isDragging: true,
      selectedLayer: {
        type: "text",
        id: safeOverlayId,
      },
    }))

    updateTextOverlayPositionFromClientPoint(
      safeOverlayId,
      event.clientX,
      event.clientY
    )

    function handleMouseMove(moveEvent: MouseEvent) {
      updateTextOverlayPositionFromClientPoint(
        safeOverlayId,
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

    if (activeTool !== "text") {
      return
    }

    event.stopPropagation()

    const overlayId = event.currentTarget.dataset.overlayId

    if (!overlayId) {
      return
    }

    const safeOverlayId = overlayId

    const currentOverlay = (editorState.textOverlays ?? []).find(
      (overlay) => overlay.id === safeOverlayId
    )

    setUiState((prev) => ({
      ...prev,
      selectedLayer: {
        type: "text",
        id: safeOverlayId,
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
      safeOverlayId,
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

        if (!startDistance || startDistance <= 0) {
          return
        }

        const currentDistance = getTouchDistance(touchA, touchB)
const ratio = currentDistance / startDistance
const speed = 1.6 // 🔥 속도 조절


        setUiState((prev) => ({
          ...prev,
          isDragging: false,
        }))

    handleChangeTextOverlayScale(safeOverlayId, startScale * Math.pow(ratio, speed))
        return
      }

      const nextTouch = moveEvent.touches[0]
      if (!nextTouch) return

      updateTextOverlayPositionFromClientPoint(
        safeOverlayId,
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

  function handleMusicStickerMouseDown(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    resetFilterSwipe()

    if (activeTool !== "music") {
      return
    }

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

    if (activeTool !== "music") {
      return
    }

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

  function handleChangeMusicStyle(style: StoryMusicStyle) {
    setEditorState((prev) => {
      if (!prev.music) {
        return prev
      }

      return {
        ...prev,
        music: {
          ...prev.music,
          style,
        },
      }
    })
  }

  function handleRemoveMusic() {
    setEditorState((prev) => ({
      ...prev,
      music: null,
    }))

    setUiState((prev) => ({
      ...prev,
      selectedLayer: null,
    }))
  }

  function renderMusicArtwork({
    artworkUrl,
    title,
    imageClassName,
    fallbackClassName,
    fallbackLabel,
  }: {
    artworkUrl?: string | null
    title?: string | null
    imageClassName: string
    fallbackClassName: string
    fallbackLabel: string
  }) {
    if (artworkUrl) {
      return (
        <img
          src={artworkUrl}
          alt={title ?? "Selected music"}
          className={imageClassName}
        />
      )
    }

    return <div className={fallbackClassName}>{fallbackLabel}</div>
  }

function handleRemoveSelectedFile() {
  setFile(null)
  setPreviewUrl(null)

  setTrim(createEmptyStoryVideoTrim())

  setEditorState(createEmptyStoryEditorState())

  setUiState({
    activeTool: null,
    selectedLayer: null,
    isPreviewMode: false,
    isDragging: false,
    isToolSheetOpen: false,
  })

  if (fileInputRef.current) {
    fileInputRef.current.value = ""
  }
}



  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onNextStory(
      normalizeStoryEditorDraft({
        media: {
          type: getStoryMediaTypeFromFile(file),
          file,
          trim,
        },
        editorState,
      })
    )
  }

  return (
    <form className="min-h-screen bg-zinc-950" onSubmit={handleSubmit}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={(e) => {
          const nextFile = e.target.files?.[0] ?? null
          setFile(nextFile)
          setTrim(createEmptyStoryVideoTrim())
        }}
        className="hidden"
      />

      <div className="flex min-h-screen w-full flex-col">
        <div className="sticky top-0 z-30 border-b border-zinc-900/80 bg-zinc-950/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
            <button
              type="button"
              onClick={() => router.push("/feed")}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Cancel
            </button>

            <p className="text-sm font-medium text-white">New story</p>

            <div className="w-[72px]" />
          </div>
        </div>

        <div className="flex flex-1 flex-col pb-28 pt-4">
          <div className="flex w-full flex-1 flex-col items-stretch">
            <div
              ref={previewContainerRef}
              onClick={() => {
                setUiState((prev) => ({
                  ...prev,
                  selectedLayer: null,
                }))
              }}
              onTouchStart={(event) => {
                if (activeTool === "filter") {
                  handleFilterSwipeStart(event.touches[0]?.clientX ?? 0)
                }
              }}
              onTouchMove={(event) => {
                if (activeTool === "filter") {
                  handleFilterSwipeMove(event.touches[0]?.clientX ?? 0)
                }
              }}
              onTouchEnd={resetFilterSwipe}
              onTouchCancel={resetFilterSwipe}
              onMouseDown={(event) => {
                if (activeTool === "filter") {
                  handleFilterSwipeStart(event.clientX)
                }
              }}
              onMouseMove={(event) => {
                if (activeTool === "filter" && (event.buttons & 1) === 1) {
                  handleFilterSwipeMove(event.clientX)
                }
              }}
              onMouseUp={resetFilterSwipe}
              className="relative w-full aspect-[9/16] overflow-hidden bg-white"
            >
              {previewUrl ? (
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
                  {file?.type.startsWith("video/") ? (
                    <video
                      src={previewUrl}
                      className="absolute inset-0 h-full w-full object-contain"
                      style={getFilterStyle(selectedFilterPreset)}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      className="absolute inset-0 h-full w-full object-contain"
                      style={getFilterStyle(selectedFilterPreset)}
                      alt="Story preview"
                    />
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-4 text-center transition active:scale-[0.96]"
                  >
                    <p className="text-base font-semibold text-zinc-900">
                      Start your story
                    </p>

                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Upload a photo or video to begin editing.
                    </p>
                  </button>
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 md:inset-[6%] md:rounded-[22px] md:border md:border-zinc-200" />




{previewUrl ? (
  <button
    type="button"
    onClick={handleRemoveSelectedFile}
   className="absolute right-2 top-2 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-lg text-white backdrop-blur-sm transition hover:bg-black/75"
    aria-label="Remove selected file"
  >
    ×
  </button>
) : null}



              {previewUrl && activeTool === "filter" && showFilterIndicator ? (
                <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full border border-zinc-200 bg-white/90 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-black backdrop-blur-sm">
                  {selectedFilterPreset}
                </div>
              ) : null}

              {previewUrl && activeTool === "filter" && !showFilterIndicator ? (
                <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[11px] text-zinc-500 opacity-80">
                  Swipe
                </div>
              ) : null}

              {editorState.textOverlays?.map((overlay) => {
                const isSelected =
                  selectedLayer?.type === "text" &&
                  selectedLayer.id === overlay.id

                return (
                  <div
                    key={overlay.id}
                    data-overlay-id={overlay.id}
                    onMouseDown={handleSelectedLayerMouseDown}
                    onTouchStart={handleSelectedLayerTouchStart}
                    className={`absolute max-w-[80%] rounded-md text-center text-white transition-all duration-150 ${
                      activeTool === "text"
                        ? "pointer-events-auto"
                        : "pointer-events-none"
                    } ${
                      isSelected
                        ? uiState.isDragging
                          ? "z-20 ring-2 ring-pink-400 shadow-2xl"
                          : "ring-2 ring-pink-400 shadow-lg"
                        : "opacity-80"
                    }`}
                    style={{
                      left: `${overlay.x * 100}%`,
                      top: `${overlay.y * 100}%`,
                      touchAction: "none",
                      transform: `translate(-50%, -50%) scale(${overlay.scale ?? 1})`,
                      transition: uiState.isDragging
                        ? "none"
                        : "transform 120ms ease-out",
                      willChange: "transform",
                    }}
                  >
                    <p
                      className={`whitespace-pre-wrap break-words font-medium ${
                        overlay.fontSize === "sm"
                          ? "text-sm"
                          : overlay.fontSize === "lg"
                            ? "text-xl"
                            : "text-base"
                      }`}
                      style={{
                        color: overlay.color ?? "#ffffff",
                      }}
                    >
                      {overlay.text || "Text overlay"}
                    </p>
                  </div>
                )
              })}

              {previewUrl ? (
                <>
                  <div className="absolute left-5 right-5 top-3 z-20">
                    <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white/88 px-3 py-2.5 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                      {renderMusicArtwork({
                        artworkUrl: selectedMusic?.artworkUrl,
                        title: selectedMusic?.title,
                        imageClassName: "h-10 w-10 rounded-xl object-cover",
                        fallbackClassName:
                          "flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-sm text-black",
                        fallbackLabel: "♪",
                      })}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-black">
                          {selectedMusic?.title ?? "음악 추가"}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {selectedMusic?.artist ?? "탭해서 음악 선택"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setUiState((prev) => ({
                            ...prev,
                            activeTool: "music",
                            isToolSheetOpen: true,
                            selectedLayer: {
                              type: "music",
                              id: "music",
                            },
                          }))
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xl leading-none text-black"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {selectedMusic ? (
                    <div
                      className={`absolute z-10 max-w-[78%] -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
                        activeTool === "music"
                          ? "pointer-events-auto cursor-grab active:cursor-grabbing"
                          : "pointer-events-none"
                      } ${
                        uiState.isDragging ? "scale-[1.08]" : "scale-100"
                      } ${
                        isMusicSelected
                          ? "rounded-2xl ring-2 ring-pink-400 shadow-xl"
                          : "opacity-90"
                      }`}
                      style={{
                        left: `${(selectedMusic.x ?? 0.22) * 100}%`,
                        top: `${(selectedMusic.y ?? 0.12) * 100}%`,
                        touchAction: "none",
                      }}
                      onMouseDown={handleMusicStickerMouseDown}
                      onTouchStart={handleMusicStickerTouchStart}
                    >
                      <div
                        className={`pointer-events-none border border-zinc-200 bg-white/88 backdrop-blur-sm ${
                          selectedMusicStyle === "minimal"
                            ? "rounded-full px-3 py-1.5"
                            : selectedMusicStyle === "bold"
                              ? "rounded-3xl px-4 py-3 shadow-2xl"
                              : "rounded-2xl px-3 py-2 shadow-lg"
                        }`}
                      >
                        {selectedMusicStyle === "minimal" ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-black">🎵</span>
                            <p className="max-w-[160px] truncate text-xs font-medium text-black">
                              {selectedMusic.title ?? "Selected music"}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {renderMusicArtwork({
                              artworkUrl: selectedMusic.artworkUrl,
                              title: selectedMusic.title,
                              imageClassName: `object-cover ${
                                selectedMusicStyle === "bold"
                                  ? "h-12 w-12 rounded-2xl"
                                  : "h-10 w-10 rounded-xl"
                              }`,
                              fallbackClassName: `flex items-center justify-center bg-zinc-100 text-black ${
                                selectedMusicStyle === "bold"
                                  ? "h-12 w-12 rounded-2xl text-base"
                                  : "h-10 w-10 rounded-xl text-sm"
                              }`,
                              fallbackLabel: "🎵",
                            })}

                            <div className="min-w-0">
                              <p
                                className={`truncate font-medium uppercase tracking-[0.18em] text-pink-600 ${
                                  selectedMusicStyle === "bold"
                                    ? "text-[10px]"
                                    : "text-[11px]"
                                }`}
                              >
                                Music
                              </p>
                              <p
                                className={`truncate font-semibold text-black ${
                                  selectedMusicStyle === "bold"
                                    ? "text-base"
                                    : "text-sm"
                                }`}
                              >
                                {selectedMusic.title ?? "Selected music"}
                              </p>
                              <p
                                className={`truncate text-zinc-500 ${
                                  selectedMusicStyle === "bold"
                                    ? "text-sm"
                                    : "text-xs"
                                }`}
                              >
                                {selectedMusic.artist ?? ""}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="mt-4 w-full px-4 md:mx-auto md:max-w-[420px] md:px-0">
              <div className="flex items-end justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3 overflow-x-auto pb-1">
                  {STORY_TOOL_CONTROLS.map((control) => {
                    const isActive = activeTool === control.tool

                    return (
                      <button
                        key={control.tool}
                        type="button"
                        onClick={() => handleOpenTool(control.tool)}
                        className={getStoryToolControlClassName(isActive)}
                      >
                        <span className="text-lg leading-none">
                          {control.icon}
                        </span>
                        <span className="mt-2 text-[11px] font-medium">
                          {control.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mb-1 inline-flex h-16 shrink-0 items-center justify-center rounded-[24px] bg-indigo-500 px-6 text-base font-semibold text-white shadow-[0_12px_30px_rgba(79,70,229,0.35)] transition-all hover:bg-indigo-400 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? "다음..." : "다음 →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isToolSheetOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closeToolSheet}
          />

          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-2xl rounded-t-[32px] border border-zinc-200 bg-white/98 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
            <div className="mx-auto flex max-w-2xl items-center justify-between px-4 pb-3 pt-3">
              <div className="mx-auto h-1.5 w-14 rounded-full bg-zinc-300" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3">
              <p className="text-sm font-medium text-black">
                {isTextToolOpen
                  ? "Text"
                  : isMusicToolOpen
                    ? "Music"
                    : isFilterToolOpen
                      ? "Filter"
                      : "Trim"}
              </p>

              <button
                type="button"
                onClick={closeToolSheet}
                className={TOOL_SHEET_ACTION_BUTTON_CLASS}
              >
                Close
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto px-4 pb-6">
              {isTextToolOpen ? (
                <div className={TOOL_SHEET_PANEL_CLASS}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-black">
                        Text overlay
                      </p>
                      <p className="text-xs text-zinc-500">
                        Add text on top of your story preview
                      </p>
                    </div>

                    {selectedTextOverlay ? (
                      <button
                        type="button"
                        onClick={handleRemoveTextOverlay}
                        className={TOOL_SHEET_ACTION_BUTTON_CLASS}
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAddTextOverlay}
                        className={TOOL_SHEET_ACTION_BUTTON_CLASS}
                      >
                        Add text
                      </button>
                    )}
                  </div>

                  {selectedTextOverlay ? (
                    <>
                      <textarea
                        value={selectedTextOverlay.text}
                        onChange={(event) =>
                          handleOverlayTextChange(event.target.value)
                        }
                        placeholder="Write overlay text..."
                        className="min-h-[120px] w-full resize-none rounded-[20px] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-black outline-none placeholder:text-zinc-400"
                      />

                      <div className="space-y-3">
                        <div>
                          <p className="mb-2 text-xs font-medium text-zinc-500">
                            Color
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {TEXT_COLOR_SWATCHES.map((color) => {
                              const isActive =
                                (selectedTextOverlay.color ?? "#ffffff") ===
                                color

                              return (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() =>
                                    handleChangeTextOverlayColor(color)
                                  }
                                  className={`h-8 w-8 rounded-full border transition ${
                                    isActive
                                      ? "border-black scale-110"
                                      : "border-zinc-300 hover:scale-105"
                                  }`}
                                  style={{ backgroundColor: color }}
                                  aria-label={`Select color ${color}`}
                                />
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      <div className={TOOL_HELP_CARD_CLASS}>
                        Drag to move. Pinch with two fingers to resize.
                      </div>

                      <p className="text-xs text-zinc-500">
                        x: {selectedTextOverlay.x.toFixed(2)} / y:{" "}
                        {selectedTextOverlay.y.toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <div className={TOOL_HELP_CARD_LOOSE_CLASS}>
                      Tap "Add text" to start, then drag it on the preview.
                    </div>
                  )}
                </div>
              ) : null}

              {isFilterToolOpen ? (
                <div className={TOOL_SHEET_COMPACT_PANEL_CLASS}>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-black">Filter</p>
                    <p className="text-sm font-medium text-black">
                      Swipe to change filters
                    </p>
                  </div>

                  <p className="text-xs text-zinc-500">
                    Left or right on the preview
                  </p>
                </div>
              ) : null}

              {isMusicToolOpen ? (
                <div className={TOOL_SHEET_RAISED_PANEL_CLASS}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-black">Music</p>
                      <p className="text-xs text-zinc-500">
                        Add background music to your story
                      </p>
                    </div>

                    {selectedMusic ? (
                      <button
                        type="button"
                        onClick={handleRemoveMusic}
                        className={TOOL_SHEET_ACTION_BUTTON_CLASS}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <input
                      value={musicQuery}
                      onChange={(event) => setMusicQuery(event.target.value)}
                      placeholder="Search music..."
                      className="w-full rounded-[20px] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-black outline-none placeholder:text-zinc-400"
                    />

                    <div className="space-y-2">
                      {!musicQuery.trim() ? (
                        <div className={TOOL_HELP_CARD_LOOSE_CLASS}>
                          Search music to add, then drag it on the preview.
                        </div>
                      ) : null}

                      {isSearchingMusic ? (
                        <div className={TOOL_HELP_CARD_CLASS}>
                          Searching...
                        </div>
                      ) : null}

                      {!isSearchingMusic &&
                      musicQuery.trim() &&
                      musicResults.length === 0 ? (
                        <div className={TOOL_HELP_CARD_CLASS}>
                          No results
                        </div>
                      ) : null}

                      {!isSearchingMusic &&
                        musicResults.map((option) => {
                          const isSelected =
                            selectedMusic?.trackId === option.trackId

                          return (
                            <button
                              key={option.trackId}
                              type="button"
                              onClick={() =>
                                handleSelectMusic({
                                  source: "external",
                                  trackId: option.trackId,
                                  title: option.title,
                                  artist: option.artist,
                                  previewUrl: option.previewUrl ?? null,
                                  artworkUrl: option.artworkUrl ?? null,
                                  duration: option.duration ?? null,
                                })
                              }
                              className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left transition ${
                                isSelected
                                  ? "border-zinc-300 bg-white text-black shadow-sm"
                                  : "border-zinc-200 bg-zinc-50 text-black hover:bg-zinc-100"
                              }`}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                {option.artworkUrl ? (
                                  <img
                                    src={option.artworkUrl}
                                    alt={option.title}
                                    className="h-10 w-10 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-xs text-zinc-500">
                                    🎵
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-black">
                                    {option.title}
                                  </p>
                                  <p className="truncate text-xs text-zinc-500">
                                    {option.artist}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`shrink-0 text-xs font-medium ${
                                  isSelected ? "text-black" : "text-zinc-500"
                                }`}
                              >
                                {isSelected ? "Selected" : "Pick"}
                              </span>
                            </button>
                          )
                        })}
                    </div>

                    {selectedMusic ? (
                      <div className="rounded-[20px] border border-zinc-200 bg-zinc-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          {renderMusicArtwork({
                            artworkUrl: selectedMusic?.artworkUrl,
                            title: selectedMusic?.title,
                            imageClassName: "h-10 w-10 rounded-xl object-cover",
                            fallbackClassName:
                              "flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-500",
                            fallbackLabel: "🎵",
                          })}

                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-pink-600">
                              Selected
                            </p>
                            <p className="truncate text-sm font-semibold text-black">
                              {selectedMusic?.title ?? "Selected music"}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {selectedMusic?.artist ?? ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {selectedMusic ? (
                      <div className={TOOL_HELP_CARD_CLASS}>
                        Drag the music sticker directly on the preview.
                      </div>
                    ) : null}

                    {selectedMusic && isMusicSelected ? (
                      <div className="rounded-[20px] border border-zinc-200 bg-zinc-50 p-3">
                        <p className="mb-2 text-xs font-medium text-zinc-500">
                          Sticker style
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {MUSIC_STYLE_CONTROLS.map((control) => {
                            const isActive =
                              selectedMusicStyle === control.style

                            return (
                              <button
                                key={control.style}
                                type="button"
                                onClick={() =>
                                  handleChangeMusicStyle(control.style)
                                }
                                className={getMusicStyleControlClassName(
                                  isActive
                                )}
                              >
                                {control.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {isTrimToolOpen ? (
                <div className={TOOL_SHEET_TRIM_PANEL_CLASS}>
                  {!file ? (
                    <div className={TOOL_HELP_CARD_CLASS}>
                      Select a video to enable trimming.
                    </div>
                  ) : null}
                  <StoryVideoTrimField file={file} onChange={setTrim} />
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </form>
  )
}
