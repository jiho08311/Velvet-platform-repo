"use client"

import type { CSSProperties } from "react"
import type { StoryEditorDraft } from "../types"

type StoryPublishPreviewProps = {
  draft: StoryEditorDraft
  previewUrl: string | null
}

function getStickerSymbol(preset: string) {
  if (preset === "sparkle") return "✨"
  if (preset === "heart") return "💖"
  if (preset === "fire") return "🔥"
  return "✨"
}

function getFilterStyle(preset?: string | null): CSSProperties {
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

export function StoryPublishPreview({
  draft,
  previewUrl,
}: StoryPublishPreviewProps) {
  const selectedFilterPreset = draft.editorState?.filter?.preset ?? "none"
  const previewMusic = draft.editorState?.music ?? null
  const previewMusicStyle = previewMusic?.style ?? "default"
  const previewMusicX = Math.min(0.78, Math.max(0.22, previewMusic?.x ?? 0.22))
  const previewMusicY = Math.min(0.22, Math.max(0.14, previewMusic?.y ?? 0.12))

  return (
    <div className="space-y-2">
      <p className="px-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        Preview
      </p>

      <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white">
        <div className="relative aspect-[9/16] w-full bg-white">
          {previewUrl ? (
            draft.media.file?.type.startsWith("video/") ? (
              <video
                src={previewUrl}
                className="h-full w-full object-contain"
                style={getFilterStyle(selectedFilterPreset)}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={previewUrl}
                alt="Story preview"
                className="h-full w-full object-contain"
                style={getFilterStyle(selectedFilterPreset)}
              />
            )
          ) : null}

          <div className="pointer-events-none absolute inset-0 md:inset-[6%] md:rounded-[22px] md:border md:border-zinc-200" />

          {previewMusic ? (
            <div
              className="pointer-events-none absolute z-20 max-w-[78%] -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(previewMusicX * 100).toFixed(2)}%`,
                top: `${(previewMusicY * 100).toFixed(2)}%`,
              }}
            >
              <div
                className={`border border-zinc-200 bg-white/88 backdrop-blur-sm ${
                  previewMusicStyle === "minimal"
                    ? "rounded-full px-3 py-1.5"
                    : previewMusicStyle === "bold"
                      ? "rounded-3xl px-4 py-3 shadow-2xl"
                      : "rounded-2xl px-3 py-2 shadow-lg"
                }`}
              >
                {previewMusicStyle === "minimal" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-black">🎵</span>
                    <p className="max-w-[160px] truncate text-xs font-medium text-black">
                      {previewMusic.title ?? "Story music"}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {previewMusic.artworkUrl ? (
                      <img
                        src={previewMusic.artworkUrl}
                        alt={previewMusic.title ?? "Story music"}
                        className={`object-cover ${
                          previewMusicStyle === "bold"
                            ? "h-12 w-12 rounded-2xl"
                            : "h-10 w-10 rounded-xl"
                        }`}
                      />
                    ) : (
                      <div
                        className={`flex items-center justify-center bg-zinc-100 text-black ${
                          previewMusicStyle === "bold"
                            ? "h-12 w-12 rounded-2xl text-base"
                            : "h-10 w-10 rounded-xl text-sm"
                        }`}
                      >
                        🎵
                      </div>
                    )}

                    <div className="min-w-0">
                      <p
                        className={`truncate font-medium uppercase tracking-[0.18em] text-pink-600 ${
                          previewMusicStyle === "bold"
                            ? "text-[10px]"
                            : "text-[11px]"
                        }`}
                      >
                        Music
                      </p>
                      <p
                        className={`truncate font-semibold text-black ${
                          previewMusicStyle === "bold" ? "text-base" : "text-sm"
                        }`}
                      >
                        {previewMusic.title ?? "Story music"}
                      </p>
                      <p
                        className={`truncate text-zinc-500 ${
                          previewMusicStyle === "bold" ? "text-sm" : "text-xs"
                        }`}
                      >
                        {previewMusic.artist ?? ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {draft.editorState.textOverlays?.map((overlay) => (
            <div
              key={overlay.id}
              className="pointer-events-none absolute z-10 max-w-[80%] text-center text-white"
              style={{
                left: `${overlay.x * 100}%`,
                top: `${overlay.y * 100}%`,
                transform: `translate(-50%, -50%) scale(${overlay.scale ?? 1})`,
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
                {overlay.text}
              </p>
            </div>
          ))}

          {draft.editorState.overlays?.map((overlay) => (
            <div
              key={overlay.id}
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 text-2xl"
              style={{
                left: `${overlay.x * 100}%`,
                top: `${overlay.y * 100}%`,
                transform: `translate(-50%, -50%) scale(${overlay.scale ?? 1}) rotate(${overlay.rotation ?? 0}deg)`,
              }}
            >
              {getStickerSymbol(overlay.preset)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
