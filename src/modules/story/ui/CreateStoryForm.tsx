"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { StoryVideoTrimField } from "@/modules/media/ui/StoryVideoTrimField"
import type { StoryEditorState, StoryMusicSearchItem } from "../types"

type StoryVisibility = "public" | "subscribers"

type SubmitStoryInput = {
  text: string
  visibility: StoryVisibility
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
  onSubmitStory: (input: SubmitStoryInput) => void
}

const OVERLAY_MOVE_STEP = 0.05

function clampPosition(value: number) {
  return Math.min(0.95, Math.max(0.05, value))
}

function getStickerSymbol(preset: string) {
  if (preset === "sparkle") return "✨"
  if (preset === "heart") return "💖"
  if (preset === "fire") return "🔥"
  return "✨"
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
  onSubmitStory,
}: CreateStoryFormProps) {
  const [text, setText] = useState("")
  const [visibility, setVisibility] = useState<StoryVisibility>("subscribers")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [musicQuery, setMusicQuery] = useState("")
  const [musicResults, setMusicResults] = useState<StoryMusicSearchItem[]>([])
  const [isSearchingMusic, setIsSearchingMusic] = useState(false)
  const [isDraggingMusic, setIsDraggingMusic] = useState(false)
  const [editorState, setEditorState] = useState<StoryEditorState>({
    textOverlays: [],
    overlays: [],
    filter: null,
    music: null,
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

  const primaryTextOverlay = editorState.textOverlays?.[0] ?? null
  const latestSticker =
    editorState.overlays?.[editorState.overlays.length - 1] ?? null
  const selectedFilterPreset = editorState.filter?.preset ?? "none"
  const selectedMusic = editorState.music
  const selectedMusicStyle = selectedMusic?.style ?? "default"

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

  function handleAddTextOverlay() {
    setEditorState((prev) => {
      if ((prev.textOverlays?.length ?? 0) > 0) {
        return prev
      }

      return {
        ...prev,
        textOverlays: [
          {
            id: crypto.randomUUID(),
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
  }

  function handleOverlayTextChange(value: string) {
    setEditorState((prev) => {
      const current = prev.textOverlays ?? []

      if (current.length === 0) {
        return prev
      }

      return {
        ...prev,
        textOverlays: current.map((overlay, index) =>
          index === 0
            ? {
                ...overlay,
                text: value,
              }
            : overlay
        ),
      }
    })
  }

  function handleMoveTextOverlay(axis: "x" | "y", direction: -1 | 1) {
    setEditorState((prev) => {
      const current = prev.textOverlays ?? []

      if (current.length === 0) {
        return prev
      }

      return {
        ...prev,
        textOverlays: current.map((overlay, index) => {
          if (index !== 0) {
            return overlay
          }

          if (axis === "x") {
            return {
              ...overlay,
              x: clampPosition(overlay.x + OVERLAY_MOVE_STEP * direction),
            }
          }

          return {
            ...overlay,
            y: clampPosition(overlay.y + OVERLAY_MOVE_STEP * direction),
          }
        }),
      }
    })
  }

  function handleRemoveTextOverlay() {
    setEditorState((prev) => ({
      ...prev,
      textOverlays: [],
    }))
  }

  function handleAddSticker(preset: "sparkle" | "heart" | "fire") {
    setEditorState((prev) => ({
      ...prev,
      overlays: [
        ...(prev.overlays ?? []),
        {
          id: crypto.randomUUID(),
          type: "sticker",
          preset,
          x: 0.5,
          y: 0.3,
          scale: 1,
          rotation: 0,
        },
      ],
    }))
  }

  function handleMoveSticker(axis: "x" | "y", direction: -1 | 1) {
    setEditorState((prev) => {
      const overlays = prev.overlays ?? []

      if (overlays.length === 0) {
        return prev
      }

      return {
        ...prev,
        overlays: overlays.map((overlay, index) => {
          if (index !== overlays.length - 1) {
            return overlay
          }

          if (axis === "x") {
            return {
              ...overlay,
              x: clampPosition(overlay.x + OVERLAY_MOVE_STEP * direction),
            }
          }

          return {
            ...overlay,
            y: clampPosition(overlay.y + OVERLAY_MOVE_STEP * direction),
          }
        }),
      }
    })
  }

  function handleRemoveLatestSticker() {
    setEditorState((prev) => ({
      ...prev,
      overlays: (prev.overlays ?? []).slice(0, -1),
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

  function handleMusicStickerMouseDown(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    event.preventDefault()
    event.stopPropagation()
    setIsDraggingMusic(true)

    updateMusicPositionFromClientPoint(event.clientX, event.clientY)

    function handleMouseMove(moveEvent: MouseEvent) {
      updateMusicPositionFromClientPoint(moveEvent.clientX, moveEvent.clientY)
    }

    function handleMouseUp() {
      setIsDraggingMusic(false)
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
    setIsDraggingMusic(true)

    const touch = event.touches[0]
    if (!touch) return

    updateMusicPositionFromClientPoint(touch.clientX, touch.clientY)

    function handleTouchMove(moveEvent: TouchEvent) {
      const nextTouch = moveEvent.touches[0]
      if (!nextTouch) return

      updateMusicPositionFromClientPoint(nextTouch.clientX, nextTouch.clientY)
    }

    function handleTouchEnd() {
      setIsDraggingMusic(false)
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
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmitStory({
      text,
      visibility,
      file,
      trim,
      editorState,
    })

    setText("")
    setVisibility("subscribers")
    setFile(null)
    setPreviewUrl(null)
    setMusicQuery("")
    setMusicResults([])
    setEditorState({
      textOverlays: [],
      overlays: [],
      filter: null,
      music: null,
    })
    setTrim({
      duration: 0,
      requiresTrim: false,
      startTime: 0,
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-0">
      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        <div
          ref={previewContainerRef}
          className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-zinc-900"
        >
          {previewUrl ? (
            file?.type.startsWith("video/") ? (
              <video
                src={previewUrl}
                className="h-full w-full object-cover"
                style={getFilterStyle(selectedFilterPreset)}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={previewUrl}
                className="h-full w-full object-cover"
                style={getFilterStyle(selectedFilterPreset)}
                alt="Story preview"
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
              Preview
            </div>
          )}

          {editorState.textOverlays?.map((overlay) => (
            <div
              key={overlay.id}
              className="pointer-events-none absolute max-w-[80%] -translate-x-1/2 -translate-y-1/2 text-center text-white"
              style={{
                left: `${overlay.x * 100}%`,
                top: `${overlay.y * 100}%`,
              }}
            >
              <p className="whitespace-pre-wrap break-words text-base font-medium">
                {overlay.text || "Text overlay"}
              </p>
            </div>
          ))}

          {editorState.overlays?.map((overlay) => (
            <div
              key={overlay.id}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-2xl"
              style={{
                left: `${overlay.x * 100}%`,
                top: `${overlay.y * 100}%`,
                transform: `translate(-50%, -50%) scale(${overlay.scale ?? 1}) rotate(${overlay.rotation ?? 0}deg)`,
              }}
            >
              {getStickerSymbol(overlay.preset)}
            </div>
          ))}

          {selectedMusic ? (
            <div
              className={`absolute z-10 max-w-[78%] -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform ${
                isDraggingMusic ? "scale-[1.04]" : "scale-100"
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
            selectedMusicStyle === "bold" ? "text-[10px]" : "text-[11px]"
          }`}
        >
          Music
        </p>
        <p
          className={`truncate font-semibold text-white ${
            selectedMusicStyle === "bold" ? "text-base" : "text-sm"
          }`}
        >
          {selectedMusic.title ?? "Selected music"}
        </p>
        <p
          className={`truncate text-zinc-300 ${
            selectedMusicStyle === "bold" ? "text-sm" : "text-xs"
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
        </div>

        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share a moment..."
            className="min-h-[120px] w-full resize-none bg-transparent text-white outline-none placeholder:text-zinc-500"
          />

          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Text overlay</p>
                <p className="text-xs text-zinc-400">
                  Add text on top of your story preview
                </p>
              </div>

              {primaryTextOverlay ? (
                <button
                  type="button"
                  onClick={handleRemoveTextOverlay}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white transition hover:bg-zinc-800"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAddTextOverlay}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white transition hover:bg-zinc-800"
                >
                  Add text
                </button>
              )}
            </div>

            {primaryTextOverlay ? (
              <>
                <textarea
                  value={primaryTextOverlay.text}
                  onChange={(event) =>
                    handleOverlayTextChange(event.target.value)
                  }
                  placeholder="Write overlay text..."
                  className="min-h-[96px] w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                />

                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-400">Position</p>

                  <div className="grid grid-cols-3 gap-2">
                    <div />
                    <button
                      type="button"
                      onClick={() => handleMoveTextOverlay("y", -1)}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-800"
                    >
                      Up
                    </button>
                    <div />

                    <button
                      type="button"
                      onClick={() => handleMoveTextOverlay("x", -1)}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-800"
                    >
                      Left
                    </button>
                    <button
                      type="button"
                      disabled
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-500"
                    >
                      Move
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveTextOverlay("x", 1)}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-800"
                    >
                      Right
                    </button>

                    <div />
                    <button
                      type="button"
                      onClick={() => handleMoveTextOverlay("y", 1)}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-800"
                    >
                      Down
                    </button>
                    <div />
                  </div>

                  <p className="text-xs text-zinc-500">
                    x: {primaryTextOverlay.x.toFixed(2)} / y:{" "}
                    {primaryTextOverlay.y.toFixed(2)}
                  </p>
                </div>
              </>
            ) : null}
          </div>

          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Stickers</p>
                <p className="text-xs text-zinc-400">
                  Add a simple sticker to your story preview
                </p>
              </div>

              {latestSticker ? (
                <button
                  type="button"
                  onClick={handleRemoveLatestSticker}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white transition hover:bg-zinc-800"
                >
                  Remove
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAddSticker("sparkle")}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-800"
              >
                ✨ Sparkle
              </button>

              <button
                type="button"
                onClick={() => handleAddSticker("heart")}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-800"
              >
                💖 Heart
              </button>

              <button
                type="button"
                onClick={() => handleAddSticker("fire")}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-800"
              >
                🔥 Fire
              </button>
            </div>

            {latestSticker ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-400">Position</p>

                <div className="grid grid-cols-3 gap-2">
                  <div />
                  <button
                    type="button"
                    onClick={() => handleMoveSticker("y", -1)}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-800"
                  >
                    Up
                  </button>
                  <div />

                  <button
                    type="button"
                    onClick={() => handleMoveSticker("x", -1)}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-800"
                  >
                    Left
                  </button>

                  <button
                    type="button"
                    disabled
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-500"
                  >
                    Move
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveSticker("x", 1)}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-800"
                  >
                    Right
                  </button>

                  <div />
                  <button
                    type="button"
                    onClick={() => handleMoveSticker("y", 1)}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-800"
                  >
                    Down
                  </button>
                  <div />
                </div>

                <p className="text-xs text-zinc-500">
                  x: {latestSticker.x.toFixed(2)} / y:{" "}
                  {latestSticker.y.toFixed(2)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div>
              <p className="text-sm font-medium text-white">Filter</p>
              <p className="text-xs text-zinc-400">
                Apply a simple preview filter to your story
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleChangeFilter("none")}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selectedFilterPreset === "none"
                    ? "border-pink-500 bg-pink-500/10 text-white"
                    : "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                None
              </button>

              <button
                type="button"
                onClick={() => handleChangeFilter("warm")}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selectedFilterPreset === "warm"
                    ? "border-pink-500 bg-pink-500/10 text-white"
                    : "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                Warm
              </button>

              <button
                type="button"
                onClick={() => handleChangeFilter("cool")}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selectedFilterPreset === "cool"
                    ? "border-pink-500 bg-pink-500/10 text-white"
                    : "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                Cool
              </button>

              <button
                type="button"
                onClick={() => handleChangeFilter("mono")}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selectedFilterPreset === "mono"
                    ? "border-pink-500 bg-pink-500/10 text-white"
                    : "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                Mono
              </button>

              <button
                type="button"
                onClick={() => handleChangeFilter("vivid")}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selectedFilterPreset === "vivid"
                    ? "border-pink-500 bg-pink-500/10 text-white"
                    : "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                Vivid
              </button>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Music</p>
                <p className="text-xs text-zinc-400">
                  Add background music to your story
                </p>
              </div>

              {selectedMusic ? (
                <button
                  type="button"
                  onClick={handleRemoveMusic}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white transition hover:bg-zinc-800"
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
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              />

              <div className="space-y-2">
                {!musicQuery.trim() ? (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/60 px-4 py-4 text-sm text-zinc-400">
                    Search by song title or artist
                  </div>
                ) : null}

                {isSearchingMusic ? (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
                    Searching...
                  </div>
                ) : null}

                {!isSearchingMusic &&
                musicQuery.trim() &&
                musicResults.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
                    No results
                  </div>
                ) : null}

                {!isSearchingMusic &&
                  musicResults.map((option) => {
                    const isSelected = selectedMusic?.trackId === option.trackId

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
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                          isSelected
                            ? "border-pink-500 bg-pink-500/10"
                            : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
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
                            <p className="truncate text-sm font-medium text-white">
                              {option.title}
                            </p>
                            <p className="truncate text-xs text-zinc-400">
                              {option.artist}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 text-xs ${
                            isSelected ? "text-pink-400" : "text-zinc-400"
                          }`}
                        >
                          {isSelected ? "Selected" : "Pick"}
                        </span>
                      </button>
                    )
                  })}
              </div>

              {selectedMusic ? (
                <div className="rounded-2xl border border-pink-500/20 bg-pink-500/10 px-3 py-3">
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
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
    <p className="mb-2 text-xs font-medium text-zinc-400">Sticker style</p>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => handleChangeMusicStyle("default")}
        className={`rounded-full border px-3 py-1.5 text-xs transition ${
          selectedMusicStyle === "default"
            ? "border-pink-500 bg-pink-500/10 text-white"
            : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        }`}
      >
        Default
      </button>

      <button
        type="button"
        onClick={() => handleChangeMusicStyle("minimal")}
        className={`rounded-full border px-3 py-1.5 text-xs transition ${
          selectedMusicStyle === "minimal"
            ? "border-pink-500 bg-pink-500/10 text-white"
            : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        }`}
      >
        Minimal
      </button>

      <button
        type="button"
        onClick={() => handleChangeMusicStyle("bold")}
        className={`rounded-full border px-3 py-1.5 text-xs transition ${
          selectedMusicStyle === "bold"
            ? "border-pink-500 bg-pink-500/10 text-white"
            : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        }`}
      >
        Bold
      </button>
    </div>
  </div>
) : null}


            </div>
          </div>

          <StoryVideoTrimField file={file} onChange={setTrim} />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <select
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as StoryVisibility)
                }
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white"
              >
                <option value="public">Public</option>
                <option value="subscribers">Subscribers</option>
              </select>

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

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-lg text-white transition hover:bg-zinc-800"
                aria-label="Upload story file"
              >
                +
              </button>

              {file ? (
                <p className="max-w-[160px] truncate text-xs text-zinc-400">
                  {file.name}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-pink-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-pink-500 disabled:opacity-50"
            >
              {isSubmitting ? "Posting..." : "Post story"}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}