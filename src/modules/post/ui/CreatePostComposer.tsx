"use client"

import { useState, useTransition } from "react"

import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client"

import { createPostAction } from "../server/create-post-action"
import { CreatePostForm } from "./CreatePostForm"

type UploadedFileInput = {
  path: string
  type: string
  mimeType: string
  size: number
  originalName: string
}

type CreatePostBlockInput = {
  type: "text" | "image" | "video" | "audio" | "file"
  content?: string | null
  sortOrder: number
  mediaId?: string | null
}

type CreatePostComposerProps = {
  creatorId: string
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

  return `creator/${now}-${random}${safeExtension}`
}

async function uploadFilesDirect(files: File[]): Promise<UploadedFileInput[]> {
  if (files.length === 0) {
    return []
  }

  const supabase = createSupabaseBrowserClient()
  const uploaded: UploadedFileInput[] = []

  for (const file of files) {
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

    uploaded.push({
      path,
      type: file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
            ? "audio"
            : "file",
      mimeType: file.type || "",
      size: file.size,
      originalName: file.name,
    })
  }

  return uploaded
}

export function CreatePostComposer({
  creatorId,
  onCreated,
}: CreatePostComposerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="border-b border-zinc-800 px-0 py-4">
        <CreatePostForm
          isSubmitting={isPending}
          onSubmitPost={({ visibility, files, blocks }) => {
            startTransition(async () => {
              try {
                setError(null)

                const uploadedFiles = await uploadFilesDirect(files)

                await createPostAction({
                  creatorId,
                  visibility,
                  files: uploadedFiles as never,
                  blocks: blocks as CreatePostBlockInput[],
                })

                onCreated?.()
              } catch (submitError) {
                if (submitError instanceof Error) {
                  if (submitError.message === "TEXT_BLOCKED") {
                    setError(
                      "부적절한 텍스트가 포함되어 있어 게시글을 올릴 수 없습니다."
                    )
                    return
                  }

                  if (submitError.message === "IMAGE_BLOCKED") {
                    setError(
                      "부적절한 이미지가 포함되어 있어 게시글을 올릴 수 없습니다."
                    )
                    return
                  }

                  setError(submitError.message)
                  return
                }

                setError("Failed to create post")
              }
            })
          }}
        />
      </div>
    </div>
  )
}