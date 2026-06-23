"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { CreateStoryForm } from "./CreateStoryForm"
import { CreateStoryPublishStep } from "./CreateStoryPublishStep"
import {
  buildStoryCreatePayloadFromDraft,
  buildStoryCreateRequestBody,
  buildStoryVideoJobPayload,
} from "@/modules/story/runtime/story-create-payload"
import {
  queueStoryVideoJob,
  waitForStoryVideoJob,
} from "@/modules/media/public/queue-story-video-job"
import { uploadStoryMediaFile } from "@/modules/media/public/upload-story-media-file"
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
      const storagePath = await uploadStoryMediaFile({ file })

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
        <CreateStoryPublishStep
          draft={draft}
          previewUrl={previewUrl}
          isPending={isPending}
          onBack={() => setStep("editor")}
          onPublish={() => handleSubmitStory(draft)}
          onDraftChange={setDraft}
        />
      ) : null}
    </div>
  )
}
