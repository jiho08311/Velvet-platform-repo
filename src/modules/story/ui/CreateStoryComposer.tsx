"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Card } from "@/shared/ui/Card"
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client"

import { createStoryAction } from "../server/create-story-action"
import { CreateStoryForm } from "./CreateStoryForm"

import {
  queueStoryVideoJob,
  waitForStoryVideoJob,
} from "@/modules/media/lib/queue-story-video-job"

type CreateStoryComposerProps = {
  onCreated?: () => void
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

export function CreateStoryComposer({
  onCreated,
}: CreateStoryComposerProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <Card className="p-4 sm:p-5">
        <CreateStoryForm
          isSubmitting={isPending}
          onSubmitStory={({ text, visibility, file, trim }) => {
            startTransition(async () => {
              try {
                setError(null)

                if (!file) {
                  throw new Error("Story file is required")
                }

                if (
                  !file.type.startsWith("image/") &&
                  !file.type.startsWith("video/")
                ) {
                  throw new Error("Only image or video files are allowed")
                }

                // ✅ video + trim flow
                if (
                  file.type.startsWith("video/") &&
                  trim?.requiresTrim
                ) {
                  const queued = await queueStoryVideoJob({
                    file,
                    visibility,
                    startTime: trim.startTime,
                  })

                  await waitForStoryVideoJob({
                    jobId: queued.jobId,
                  })

                  router.refresh()
                  onCreated?.()
                  return
                }

                // ✅ 기존 업로드 flow
                const storagePath = await uploadStoryFile(file)

                await createStoryAction({
                  storagePath,
                  text,
                  visibility,
                })

                router.refresh()
                onCreated?.()
              } catch (submitError) {
                if (submitError instanceof Error) {
                  setError(submitError.message)
                  return
                }

                setError("Failed to create story")
              }
            })
          }}
        />
      </Card>
    </div>
  )
}