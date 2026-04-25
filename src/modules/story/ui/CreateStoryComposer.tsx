"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client"
import { CreateStoryForm } from "./CreateStoryForm"
import {
  buildStoryCreatePayloadFromDraft,
  buildStoryCreateRequestBody,
  buildStoryVideoJobPayload,
} from "../lib/story-create-payload"
import {
  queueStoryVideoJob,
  waitForStoryVideoJob,
} from "@/modules/media/lib/queue-story-video-job"
import type { StoryEditorDraft } from "../types"

type CreateStoryComposerProps = {
  onCreated?: () => void
}

type StorySubmitPhase =
  | "idle"
  | "uploading"
  | "processing"
  | "publishing"

type StoryComposerStep = "editor" | "publish"

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

function getFileExtension(fileName: string): string {
  const parts = fileName.split(".")
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ""
}

function buildClientUploadPath(file: File) {
  const now = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  const extension = getFileExtension(file.name)
  const safeExtension = extension ? `.${extension}` : ""

  return `story/${now}-${random}${safeExtension}`
}

async function uploadStoryFile(file: File): Promise<string> {
  const supabase = createSupabaseBrowserClient()
  const path = buildClientUploadPath(file)

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  return path
}

function getPhaseLabel(phase: StorySubmitPhase) {
  if (phase === "uploading") {
    return "Uploading story media..."
  }

  if (phase === "processing") {
    return "Processing story video..."
  }

  if (phase === "publishing") {
    return "Publishing story..."
  }

  return ""
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

export function CreateStoryComposer({
  onCreated,
}: CreateStoryComposerProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<StorySubmitPhase>("idle")
  const [isPending, setIsPending] = useState(false)
  const [step, setStep] = useState<StoryComposerStep>("editor")
  const [draft, setDraft] = useState<StoryEditorDraft | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!draft?.media.file) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(draft.media.file)
    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [draft?.media.file])

  const selectedFilterPreset = draft?.editorState?.filter?.preset ?? "none"
  const previewMusic = draft?.editorState?.music ?? null
  const previewMusicStyle = previewMusic?.style ?? "default"
  const previewMusicX = Math.min(0.78, Math.max(0.22, previewMusic?.x ?? 0.22))
  const previewMusicY = Math.min(0.22, Math.max(0.14, previewMusic?.y ?? 0.12))
  const draftVisibility = draft?.visibility ?? "subscribers"

  async function handleSubmitStory(storyDraft: StoryEditorDraft) {
    try {
      setError(null)
      setIsPending(true)

      const { media } = storyDraft
      const file = media.file
      const trim = media.trim
      const story = buildStoryCreatePayloadFromDraft(storyDraft)

      if (!file) {
        throw new Error("Story file is required")
      }

      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        throw new Error("Only image or video files are allowed")
      }

      if (file.type.startsWith("video/") && trim?.requiresTrim) {
        setPhase("uploading")

        const queued = await queueStoryVideoJob(
          {
            file,
            ...buildStoryVideoJobPayload({
              story,
              startTime: trim.startTime,
            }),
          }
        )

        setPhase("processing")

        const completedJob = await waitForStoryVideoJob({
          jobId: queued.jobId,
        })

        if (!completedJob.storyId) {
          throw new Error("Processed story is missing story id")
        }

        setPhase("publishing")

        onCreated?.()
        router.push("/feed")
        router.refresh()
        return
      }

      setPhase("uploading")
      const storagePath = await uploadStoryFile(file)

      setPhase("publishing")
      const res = await fetch("/api/story/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(
          buildStoryCreateRequestBody({
            storagePath,
            story,
          })
        ),
      })

      if (!res.ok) {
        const raw = await res.text()
        throw new Error(raw || "Failed to create story")
      }

      onCreated?.()
      router.push("/feed")
      router.refresh()
    } catch (submitError) {
      setPhase("idle")

      if (submitError instanceof Error) {
        setError(submitError.message)
        return
      }

      setError("Failed to create story")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {phase !== "idle" ? (
        <div className="rounded-3xl border border-pink-500/20 bg-pink-500/10 px-4 py-3 text-sm text-pink-700">
          {getPhaseLabel(phase)}
        </div>
      ) : null}

      {step === "editor" ? (
        <CreateStoryForm
          isSubmitting={isPending}
          onNextStory={(input) => {
            setDraft(input)
            setStep("publish")
          }}
        />
      ) : draft ? (
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("editor")}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-black transition hover:bg-zinc-100"
              >
                Back
              </button>

              <p className="text-sm font-medium text-black">Story settings</p>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSubmitStory(draft)}
                className="rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-pink-500 disabled:opacity-50"
              >
                {isPending ? "Publishing..." : "Publish"}
              </button>
            </div>

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
                                  previewMusicStyle === "bold"
                                    ? "text-base"
                                    : "text-sm"
                                }`}
                              >
                                {previewMusic.title ?? "Story music"}
                              </p>
                              <p
                                className={`truncate text-zinc-500 ${
                                  previewMusicStyle === "bold"
                                    ? "text-sm"
                                    : "text-xs"
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

            <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 space-y-1">
                <p className="text-sm font-medium text-black">Visibility</p>
                <p className="text-xs text-zinc-500">
                  Choose who can view this story after publishing.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            visibility: "public",
                          }
                        : prev
                    )
                  }
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    draftVisibility === "public"
                      ? "border-pink-500 bg-pink-500/10 text-black"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Public
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            visibility: "subscribers",
                          }
                        : prev
                    )
                  }
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    draftVisibility === "subscribers"
                      ? "border-pink-500 bg-pink-500/10 text-black"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  Subscribers
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
