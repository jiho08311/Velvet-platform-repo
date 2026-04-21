"use client"

import { useState, useTransition } from "react"
import { localDateTimeToUtcIso } from "@/shared/lib/date-time"
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client"

import { createPostAction } from "../server/create-post-action"
import type {
  CreatePostDraftBlock,
  CreatePostUploadedMediaInput,
} from "../types"
import { CreatePostForm } from "./CreatePostForm"



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

async function uploadFilesDirect(files: File[]): Promise<CreatePostUploadedMediaInput[]> {
  if (files.length === 0) {
    return []
  }

  const supabase = createSupabaseBrowserClient()
  const uploaded: CreatePostUploadedMediaInput[] = []

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


function collectUploadedFilesFromDraft(
  blocks: CreatePostDraftBlock[],
  uploadedFiles: Record<string, File>
): File[] {
  const files: File[] = []

  for (const block of blocks) {
    if (block.type === "text") {
      continue
    }

    if (block.type === "carousel") {
      for (const item of block.items) {
        if (item.media.kind !== "uploaded") {
          continue
        }

        const file = uploadedFiles[item.media.uploaded.path]
        if (file) {
          files.push(file)
        }
      }

      continue
    }

    if (block.media.kind !== "uploaded") {
      continue
    }

    const file = uploadedFiles[block.media.uploaded.path]
    if (file) {
      files.push(file)
    }
  }

  return files
}

function replaceUploadedDraftPaths(params: {
  blocks: CreatePostDraftBlock[]
  uploadedFiles: CreatePostUploadedMediaInput[]
}): CreatePostDraftBlock[] {
  let uploadedIndex = 0

  return params.blocks.map((block, sortOrder) => {
    if (block.type === "text") {
      return {
        ...block,
        sortOrder,
      }
    }

    if (block.type === "carousel") {
      return {
        ...block,
        sortOrder,
        items: block.items.map((item) => {
          if (item.media.kind !== "uploaded") {
            return item
          }

          const uploaded = params.uploadedFiles[uploadedIndex]

          if (!uploaded) {
            throw new Error("Uploaded carousel media mapping failed")
          }

          uploadedIndex += 1

          return {
            ...item,
            media: {
              kind: "uploaded" as const,
              uploaded,
            },
          }
        }),
      }
    }

    if (block.media.kind !== "uploaded") {
      return {
        ...block,
        sortOrder,
      }
    }

    const uploaded = params.uploadedFiles[uploadedIndex]

    if (!uploaded) {
      throw new Error("Uploaded media mapping failed")
    }

    uploadedIndex += 1

    return {
      ...block,
      sortOrder,
      media: {
        kind: "uploaded" as const,
        uploaded,
      },
    }
  })
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
      onSubmitPost={({
  visibility,
  publishMode,
  publishedAt,
  blocks,
  uploadedFiles,
}) => {
            startTransition(async () => {
              try {
                setError(null)

           const filesToUpload = collectUploadedFilesFromDraft(
  blocks,
  uploadedFiles
)

const uploadedMedia = await uploadFilesDirect(filesToUpload)

const normalizedBlocks = replaceUploadedDraftPaths({
  blocks,
  uploadedFiles: uploadedMedia,
})

                const resolvedPublishedAt =
                  publishMode === "scheduled"
                    ? localDateTimeToUtcIso(publishedAt)
                    : null

                if (publishMode === "scheduled" && !resolvedPublishedAt) {
                  setError("예약 발행 시간을 올바르게 입력해주세요.")
                  return
                }

              await createPostAction({
  creatorId,
  status: publishMode === "scheduled" ? "scheduled" : "draft",
  publishedAt: resolvedPublishedAt,
  visibility,
  blocks: normalizedBlocks,
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