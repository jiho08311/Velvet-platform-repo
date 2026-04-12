"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Card } from "@/shared/ui/Card"
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client"

import { createStoryAction } from "../server/create-story-action"
import { CreateStoryForm } from "./CreateStoryForm"

import {
  queueStoryVideoJob,
  waitForStoryVideoJob,
} from "@/modules/media/lib/queue-story-video-job"
import type { StoryEditorState } from "../types"

type CreateStoryComposerProps = {
  onCreated?: () => void
}

type StorySubmitPhase =
  | "idle"
  | "uploading"
  | "processing"
  | "publishing"

type SubmitStoryInput = {
  text: string
  visibility: "public" | "subscribers"
  file: File | null
  trim: {
    duration: number
    requiresTrim: boolean
    startTime: number
  }
  editorState: StoryEditorState
}

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

export function CreateStoryComposer({
  onCreated,
}: CreateStoryComposerProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<StorySubmitPhase>("idle")
  const [isPending, setIsPending] = useState(false)

  async function handleSubmitStory({
    text,
    visibility,
    file,
    trim,
    editorState,
  }: SubmitStoryInput) {
    try {
      setError(null)
      setIsPending(true)

      if (!file) {
        throw new Error("Story file is required")
      }

      if (
        !file.type.startsWith("image/") &&
        !file.type.startsWith("video/")
      ) {
        throw new Error("Only image or video files are allowed")
      }

      if (file.type.startsWith("video/") && trim?.requiresTrim) {
        setPhase("uploading")

        const queued = await queueStoryVideoJob({
          file,
          visibility,
          startTime: trim.startTime,
          editorState,
        })

        setPhase("processing")

        await waitForStoryVideoJob({
          jobId: queued.jobId,
        })

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
  body: JSON.stringify({
    storagePath,
    text,
    visibility,
    editorState,
  }),
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
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {phase !== "idle" ? (
        <div className="rounded-3xl border border-pink-500/20 bg-pink-500/10 px-4 py-3 text-sm text-pink-200">
          {getPhaseLabel(phase)}
        </div>
      ) : null}

      <Card className="p-4 sm:p-5">
        <CreateStoryForm
          isSubmitting={isPending}
          onSubmitStory={handleSubmitStory}
        />
      </Card>
    </div>
  )
}