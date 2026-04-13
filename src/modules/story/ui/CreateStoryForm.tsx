"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { StoryVideoTrimField } from "@/modules/media/ui/StoryVideoTrimField"
import type {
  StoryEditorState,
  StoryEditorUiState,
  StoryMusicSearchItem,
} from "../types"

type SubmitStoryInput = {
  file: File | null
  trim: {
    duration: number
    requiresTrim: boolean
    startTime: number
  }
  editorState: StoryEditorState
}

type CreateStoryFormProps = {
  isSubmitting?: boolean
  onNextStory: (input: SubmitStoryInput) => void
}

function clampPosition(value: number) {
  return Math.min(0.95, Math.max(0.05, value))
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
  const [editorState, setEditorState] = useState<StoryEditorState>({
    textOverlays: [],
    overlays: [],
    filter: null,
    music: null,
  })
  const [uiState, setUiState] = useState<StoryEditorUiState>({
    activeTool: null,
    selectedLayer: null,
    isPreviewMode: false,
    isDragging: false,
  })

  const [trim, setTrim] = useState({
    duration: 0,
    requiresTrim: false,
    startTime: 0,
  })

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewContainerRef = useRef<HTMLDivElement | null>(null)

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

  const activeTool = uiState.activeTool
  const isTextToolOpen = activeTool === "text"
  const isMusicToolOpen = activeTool === "music"
  const isFilterToolOpen = activeTool === "filter"
  const isTrimToolOpen = activeTool === "trim"
  const isToolSheetOpen = activeTool !== null

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
      activeTool: null,
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
            align: "center",
            color: "#ffffff",
            fontSize: "md",
          },
        ],
      }
    })

    setUiState((prev) => ({
      ...prev,
      activeTool: "text",
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

  function handleChangeTextOverlayAlign(align: "left" | "center" | "right") {
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
                align,
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
        x: 0.22,
        y: 0.12,
        style: prev.music?.style ?? "default",
      },
    }))

    setUiState((prev) => ({
      ...prev,
      activeTool: "music",
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
          x: nextX,
          y: nextY,
        },
      }
    })
  }

  function updateSelectedLayerPositionFromClientPoint(
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

    if (selectedLayer?.type === "text") {
      setEditorState((prev) => ({
        ...prev,
        textOverlays: (prev.textOverlays ?? []).map((overlay) =>
          overlay.id === selectedLayer.id
            ? {
                ...overlay,
                x: nextX,
                y: nextY,
              }
            : overlay
        ),
      }))
    }
  }

  function handleSelectedLayerMouseDown(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    if (selectedLayer?.type !== "text") {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    setUiState((prev) => ({
      ...prev,
      isDragging: true,
    }))

    updateSelectedLayerPositionFromClientPoint(event.clientX, event.clientY)

    function handleMouseMove(moveEvent: MouseEvent) {
      updateSelectedLayerPositionFromClientPoint(
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
    if (selectedLayer?.type !== "text") {
      return
    }

    event.stopPropagation()

    const touch = event.touches[0]
    if (!touch) return

    setUiState((prev) => ({
      ...prev,
      isDragging: true,
    }))

    updateSelectedLayerPositionFromClientPoint(touch.clientX, touch.clientY)

    function handleTouchMove(moveEvent: TouchEvent) {
      const nextTouch = moveEvent.touches[0]
      if (!nextTouch) return

      updateSelectedLayerPositionFromClientPoint(
        nextTouch.clientX,
        nextTouch.clientY
      )
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

    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("touchcancel", handleTouchEnd)
  }

  function handleMusicStickerMouseDown(
    event: React.MouseEvent<HTMLDivElement>
  ) {
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

    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("touchcancel", handleTouchEnd)
  }

  function handleChangeMusicStyle(style: "default" | "minimal" | "bold") {
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onNextStory({
      file,
      trim,
      editorState,
    })
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
          setTrim({
            duration: 0,
            requiresTrim: false,
            startTime: 0,
          })
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
              className={`relative w-full aspect-[9/16] overflow-hidden ${
                previewUrl ? "bg-black" : "bg-white"
              }`}
            >
              {previewUrl ? (
                <div className="absolute inset-0">
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

              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
              <div className="pointer-events-none absolute inset-0 md:inset-[6%] md:rounded-[22px] md:border md:border-white/10" />
              <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm md:left-4 md:top-4">
                Story preview
              </div>

{selectedMusic ? (
  <div className="absolute left-3 right-3 top-12 z-20 flex items-center gap-3">
    {/* 음악 카드 */}
    <div className="flex flex-1 items-center gap-3 rounded-full bg-zinc-800/70 px-3 py-2 backdrop-blur-md">
      {selectedMusic.artworkUrl ? (
        <img
          src={selectedMusic.artworkUrl}
          alt={selectedMusic.title ?? "music"}
          className="h-9 w-9 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-700 text-xs text-white">
          ♪
        </div>
      )}

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">
          {selectedMusic.title ?? "Selected music"}
        </p>
        <p className="truncate text-xs text-zinc-300">
          {selectedMusic.artist ?? ""}
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setUiState((prev) => ({
            ...prev,
            activeTool: "music",
          }))
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-white"
      >
        +
      </button>
    </div>
  </div>
) : null}


              {editorState.textOverlays?.map((overlay) => {
                const isSelected =
                  selectedLayer?.type === "text" &&
                  selectedLayer.id === overlay.id

                return (
                  <div
                    key={overlay.id}
                    onClick={(event) => {
                      event.stopPropagation()
                      setUiState((prev) => ({
                        ...prev,
                        activeTool: "text",
                        selectedLayer: {
                          type: "text",
                          id: overlay.id,
                        },
                      }))
                    }}
                    onMouseDown={handleSelectedLayerMouseDown}
                    onTouchStart={handleSelectedLayerTouchStart}
                    className={`absolute max-w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-md text-center text-white transition-all duration-150 ${
                      isSelected
                        ? uiState.isDragging
                          ? "ring-2 ring-pink-400 scale-110 shadow-2xl z-20"
                          : "ring-2 ring-pink-400 scale-105 shadow-lg"
                        : "opacity-80"
                    }`}
                    style={{
                      left: `${overlay.x * 100}%`,
                      top: `${overlay.y * 100}%`,
                      touchAction: "none",
                      textAlign: overlay.align ?? "center",
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

        {selectedMusic ? (
  <>
    <div className="absolute left-4 right-4 top-14 z-20">
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-zinc-800/70 px-3 py-2 backdrop-blur-md">
        {selectedMusic.artworkUrl ? (
          <img
            src={selectedMusic.artworkUrl}
            alt={selectedMusic.title ?? "Selected music"}
            className="h-10 w-10 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-700 text-sm text-white">
            ♪
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {selectedMusic.title ?? "Selected music"}
          </p>
          <p className="truncate text-xs text-zinc-300">
            {selectedMusic.artist ?? "추천 오디오"}
          </p>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setUiState((prev) => ({
              ...prev,
              activeTool: "music",
              selectedLayer: {
                type: "music",
                id: "music",
              },
            }))
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700/90 text-2xl leading-none text-white"
        >
          +
        </button>
      </div>
    </div>

    <div
      onClick={(event) => {
        event.stopPropagation()
        setUiState((prev) => ({
          ...prev,
          activeTool: "music",
          selectedLayer: {
            type: "music",
            id: "music",
          },
        }))
      }}
      className={`absolute z-10 max-w-[78%] -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-all duration-150 ${
        uiState.isDragging ? "scale-[1.08]" : "scale-100"
      } ${
        isMusicSelected
          ? "ring-2 ring-pink-400 shadow-xl rounded-2xl"
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
        className={`pointer-events-none border border-white/10 bg-black/65 backdrop-blur-sm ${
          selectedMusicStyle === "minimal"
            ? "rounded-full px-3 py-1.5"
            : selectedMusicStyle === "bold"
              ? "rounded-3xl px-4 py-3 shadow-2xl"
              : "rounded-2xl px-3 py-2 shadow-lg"
        }`}
      >
        {selectedMusicStyle === "minimal" ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">🎵</span>
            <p className="max-w-[160px] truncate text-xs font-medium text-white">
              {selectedMusic.title ?? "Selected music"}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {selectedMusic.artworkUrl ? (
              <img
                src={selectedMusic.artworkUrl}
                alt={selectedMusic.title ?? "Selected music"}
                className={`object-cover ${
                  selectedMusicStyle === "bold"
                    ? "h-12 w-12 rounded-2xl"
                    : "h-10 w-10 rounded-xl"
                }`}
              />
            ) : (
              <div
                className={`flex items-center justify-center bg-white/10 text-white ${
                  selectedMusicStyle === "bold"
                    ? "h-12 w-12 rounded-2xl text-base"
                    : "h-10 w-10 rounded-xl text-sm"
                }`}
              >
                🎵
              </div>
            )}

            <div className="min-w-0">
              <p
                className={`truncate font-medium uppercase tracking-[0.18em] text-pink-300 ${
                  selectedMusicStyle === "bold"
                    ? "text-[10px]"
                    : "text-[11px]"
                }`}
              >
                Music
              </p>
              <p
                className={`truncate font-semibold text-white ${
                  selectedMusicStyle === "bold"
                    ? "text-base"
                    : "text-sm"
                }`}
              >
                {selectedMusic.title ?? "Selected music"}
              </p>
              <p
                className={`truncate text-zinc-300 ${
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
  </>
) : null}
            </div>

            <div className="mt-4 w-full px-4 md:mx-auto md:max-w-[420px] md:px-0">
              <div className="flex items-end justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() =>
                      setUiState((prev) => ({
                        ...prev,
                        activeTool: prev.activeTool === "music" ? null : "music",
                      }))
                    }
                    className={`flex h-[72px] min-w-[72px] shrink-0 flex-col items-center justify-center rounded-[22px] border px-3 transition-all ${
                      isMusicToolOpen
                        ? "border-white/20 bg-white text-black shadow-lg"
                        : "border-white/10 bg-white/10 text-white backdrop-blur-xl"
                    }`}
                  >
                    <span className="text-lg leading-none">♫</span>
                    <span className="mt-2 text-[11px] font-medium">오디오</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setUiState((prev) => ({
                        ...prev,
                        activeTool: prev.activeTool === "text" ? null : "text",
                      }))
                    }
                    className={`flex h-[72px] min-w-[72px] shrink-0 flex-col items-center justify-center rounded-[22px] border px-3 transition-all ${
                      isTextToolOpen
                        ? "border-white/20 bg-white text-black shadow-lg"
                        : "border-white/10 bg-white/10 text-white backdrop-blur-xl"
                    }`}
                  >
                    <span className="text-lg leading-none">Aa</span>
                    <span className="mt-2 text-[11px] font-medium">텍스트</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-[72px] min-w-[72px] shrink-0 flex-col items-center justify-center rounded-[22px] border border-white/10 bg-white/10 px-3 text-white backdrop-blur-xl transition-all"
                  >
                    <span className="text-lg leading-none">▣</span>
                    <span className="mt-2 text-[11px] font-medium">오버레이</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setUiState((prev) => ({
                        ...prev,
                        activeTool:
                          prev.activeTool === "filter" ? null : "filter",
                      }))
                    }
                    className={`flex h-[72px] min-w-[72px] shrink-0 flex-col items-center justify-center rounded-[22px] border px-3 transition-all ${
                      isFilterToolOpen
                        ? "border-white/20 bg-white text-black shadow-lg"
                        : "border-white/10 bg-white/10 text-white backdrop-blur-xl"
                    }`}
                  >
                    <span className="text-lg leading-none">◌</span>
                    <span className="mt-2 text-[11px] font-medium">필터</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setUiState((prev) => ({
                        ...prev,
                        activeTool: prev.activeTool === "trim" ? null : "trim",
                      }))
                    }
                    className={`flex h-[72px] min-w-[72px] shrink-0 flex-col items-center justify-center rounded-[22px] border px-3 transition-all ${
                      isTrimToolOpen
                        ? "border-white/20 bg-white text-black shadow-lg"
                        : "border-white/10 bg-white/10 text-white backdrop-blur-xl"
                    }`}
                  >
                    <span className="text-lg leading-none">⚙</span>
                    <span className="mt-2 text-[11px] font-medium">수정</span>
                  </button>
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

          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-2xl rounded-t-[32px] border border-zinc-800 bg-zinc-950/98 shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex max-w-2xl items-center justify-between px-4 pb-3 pt-3">
              <div className="mx-auto h-1.5 w-14 rounded-full bg-zinc-700" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3">
              <p className="text-sm font-medium text-white">
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
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto px-4 pb-6">
              {isTextToolOpen ? (
                <div className="space-y-5 rounded-[24px] border border-white/10 bg-black/60 p-5 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">
                        Text overlay
                      </p>
                      <p className="text-xs text-zinc-400">
                        Add text on top of your story preview
                      </p>
                    </div>

                    {selectedTextOverlay ? (
                      <button
                        type="button"
                        onClick={handleRemoveTextOverlay}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAddTextOverlay}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
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
                        className="min-h-[120px] w-full resize-none rounded-[20px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none placeholder:text-zinc-500"
                      />

                      <div className="space-y-3">
                        <div>
                          <p className="mb-2 text-xs font-medium text-zinc-400">
                            Size
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleChangeTextOverlayFontSize("sm")
                              }
                              className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                                (selectedTextOverlay.fontSize ?? "md") === "sm"
                                  ? "border-pink-500 bg-pink-500/10 text-white"
                                  : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                              }`}
                            >
                              Small
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleChangeTextOverlayFontSize("md")
                              }
                              className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                                (selectedTextOverlay.fontSize ?? "md") === "md"
                                  ? "border-pink-500 bg-pink-500/10 text-white"
                                  : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                              }`}
                            >
                              Medium
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleChangeTextOverlayFontSize("lg")
                              }
                              className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                                (selectedTextOverlay.fontSize ?? "md") === "lg"
                                  ? "border-pink-500 bg-pink-500/10 text-white"
                                  : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                              }`}
                            >
                              Large
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-medium text-zinc-400">
                            Align
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleChangeTextOverlayAlign("left")}
                              className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                                (selectedTextOverlay.align ?? "center") ===
                                "left"
                                  ? "border-pink-500 bg-pink-500/10 text-white"
                                  : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                              }`}
                            >
                              Left
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleChangeTextOverlayAlign("center")
                              }
                              className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                                (selectedTextOverlay.align ?? "center") ===
                                "center"
                                  ? "border-pink-500 bg-pink-500/10 text-white"
                                  : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                              }`}
                            >
                              Center
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleChangeTextOverlayAlign("right")
                              }
                              className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                                (selectedTextOverlay.align ?? "center") ===
                                "right"
                                  ? "border-pink-500 bg-pink-500/10 text-white"
                                  : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                              }`}
                            >
                              Right
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-medium text-zinc-400">
                            Color
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {["#ffffff", "#f472b6", "#facc15", "#60a5fa", "#4ade80"].map(
                              (color) => {
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
                                        ? "border-white scale-110"
                                        : "border-zinc-700 hover:scale-105"
                                    }`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Select color ${color}`}
                                  />
                                )
                              }
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
                        Tap text to select it, then drag it directly on the
                        preview.
                      </div>

                      <p className="text-xs text-zinc-500">
                        x: {selectedTextOverlay.x.toFixed(2)} / y:{" "}
                        {selectedTextOverlay.y.toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-zinc-400">
                      Tap "Add text" to start, then drag it on the preview.
                    </div>
                  )}
                </div>
              ) : null}

              {isFilterToolOpen ? (
                <div className="space-y-5 rounded-[24px] border border-white/10 bg-black/60 p-5 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">Filter</p>
                    <p className="text-xs text-zinc-400">
                      Apply a simple preview filter to your story
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
                    Select a filter to preview changes instantly.
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleChangeFilter("none")}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        selectedFilterPreset === "none"
                          ? "border-pink-500 bg-pink-500/10 text-white"
                          : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      None
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChangeFilter("warm")}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        selectedFilterPreset === "warm"
                          ? "border-pink-500 bg-pink-500/10 text-white"
                          : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      Warm
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChangeFilter("cool")}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        selectedFilterPreset === "cool"
                          ? "border-pink-500 bg-pink-500/10 text-white"
                          : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      Cool
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChangeFilter("mono")}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        selectedFilterPreset === "mono"
                          ? "border-pink-500 bg-pink-500/10 text-white"
                          : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      Mono
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChangeFilter("vivid")}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        selectedFilterPreset === "vivid"
                          ? "border-pink-500 bg-pink-500/10 text-white"
                          : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      Vivid
                    </button>
                  </div>
                </div>
              ) : null}

              {isMusicToolOpen ? (
                <div className="space-y-5 rounded-[24px] border border-white/10 bg-black/60 p-5 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">Music</p>
                      <p className="text-xs text-zinc-400">
                        Add background music to your story
                      </p>
                    </div>

                    {selectedMusic ? (
                      <button
                        type="button"
                        onClick={handleRemoveMusic}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
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
                      className="w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                    />

                    <div className="space-y-2">
                      {!musicQuery.trim() ? (
                        <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-zinc-400">
                          Search music to add, then drag it on the preview.
                        </div>
                      ) : null}

                      {isSearchingMusic ? (
                        <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
                          Searching...
                        </div>
                      ) : null}

                      {!isSearchingMusic &&
                      musicQuery.trim() &&
                      musicResults.length === 0 ? (
                        <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
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
                                  ? "border-white/20 bg-white text-black shadow-lg"
                                  : "border-white/10 bg-white/5 text-white hover:bg-white/10"
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
                                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-800 text-xs text-zinc-400">
                                    🎵
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p
                                    className={`truncate text-sm font-medium ${
                                      isSelected ? "text-black" : "text-white"
                                    }`}
                                  >
                                    {option.title}
                                  </p>
                                  <p
                                    className={`truncate text-xs ${
                                      isSelected ? "text-zinc-600" : "text-zinc-400"
                                    }`}
                                  >
                                    {option.artist}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`shrink-0 text-xs font-medium ${
                                  isSelected ? "text-black" : "text-zinc-400"
                                }`}
                              >
                                {isSelected ? "Selected" : "Pick"}
                              </span>
                            </button>
                          )
                        })}
                    </div>

                    {selectedMusic ? (
                      <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                        <div className="flex items-center gap-3">
                          {selectedMusic.artworkUrl ? (
                            <img
                              src={selectedMusic.artworkUrl}
                              alt={selectedMusic.title ?? "Selected music"}
                              className="h-10 w-10 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-sm text-zinc-300">
                              🎵
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-pink-300">
                              Selected
                            </p>
                            <p className="truncate text-sm font-semibold text-white">
                              {selectedMusic.title ?? "Selected music"}
                            </p>
                            <p className="truncate text-xs text-zinc-400">
                              {selectedMusic.artist ?? ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {selectedMusic ? (
                      <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
                        Drag the music sticker directly on the preview.
                      </div>
                    ) : null}

                    {selectedMusic && isMusicSelected ? (
                      <div className="rounded-[20px] border border-white/10 bg-white/5 p-3">
                        <p className="mb-2 text-xs font-medium text-zinc-400">
                          Sticker style
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleChangeMusicStyle("default")}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                              selectedMusicStyle === "default"
                                ? "border-pink-500 bg-pink-500/10 text-white"
                                : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                            }`}
                          >
                            Default
                          </button>

                          <button
                            type="button"
                            onClick={() => handleChangeMusicStyle("minimal")}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                              selectedMusicStyle === "minimal"
                                ? "border-pink-500 bg-pink-500/10 text-white"
                                : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                            }`}
                          >
                            Minimal
                          </button>

                          <button
                            type="button"
                            onClick={() => handleChangeMusicStyle("bold")}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                              selectedMusicStyle === "bold"
                                ? "border-pink-500 bg-pink-500/10 text-white"
                                : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                            }`}
                          >
                            Bold
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {isTrimToolOpen ? (
                <div className="rounded-[24px] border border-white/10 bg-black/60 p-5 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
                  {!file ? (
                    <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
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