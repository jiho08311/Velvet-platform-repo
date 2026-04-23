"use client"

import { useState, useTransition } from "react"
import { localDateTimeToUtcIso } from "@/shared/lib/date-time"
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client"

import { createPostAction } from "../server/create-post-action"
import type {
  CreateOrEditPostFormBlock,
  CreatePostClientDraftBlock,
  CreatePostCarouselItem,
  CreatePostUploadedMediaInput,
} from "../types"
import { CreatePostForm } from "./CreatePostForm"
import { resolveCreatePostComposerErrorPresentation } from "./post-composer-ui-state"



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

type ClientUploadEntry = {
  placeholderId: string
  file: File
}

function createExistingFormMediaSource(mediaId: string) {
  return {
    kind: "existing" as const,
    mediaId,
  }
}

function createUploadedFormMediaSource(uploaded: CreatePostUploadedMediaInput) {
  return {
    kind: "uploaded" as const,
    uploaded,
  }
}

async function uploadFilesDirect(
  files: ClientUploadEntry[]
): Promise<Record<string, CreatePostUploadedMediaInput>> {
  if (files.length === 0) {
    return {}
  }

  const supabase = createSupabaseBrowserClient()
  const uploaded: Record<string, CreatePostUploadedMediaInput> = {}

  for (const entry of files) {
    const path = buildClientUploadPath(entry.file)

    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, entry.file, {
        cacheControl: "3600",
        contentType: entry.file.type || undefined,
        upsert: false,
      })

    if (error) {
      throw new Error(error.message)
    }

    uploaded[entry.placeholderId] = {
      path,
      type: entry.file.type.startsWith("image/")
        ? "image"
        : entry.file.type.startsWith("video/")
          ? "video"
          : entry.file.type.startsWith("audio/")
            ? "audio"
            : "file",
      mimeType: entry.file.type || "",
      size: entry.file.size,
      originalName: entry.file.name,
    }
  }

  return uploaded
}


function collectUploadedFilesFromDraft(
  blocks: CreatePostClientDraftBlock[],
  uploadedFiles: Record<string, File>
): ClientUploadEntry[] {
  const files: ClientUploadEntry[] = []

  for (const block of blocks) {
    if (block.type === "text") {
      continue
    }

    if (block.type === "carousel") {
      for (const item of block.items) {
        if (item.media.kind !== "uploaded") {
          continue
        }

        const file = uploadedFiles[item.media.uploaded.placeholderId]
        if (file) {
          files.push({
            placeholderId: item.media.uploaded.placeholderId,
            file,
          })
        }
      }

      continue
    }

    if (block.media.kind !== "uploaded") {
      continue
    }

    const file = uploadedFiles[block.media.uploaded.placeholderId]
    if (file) {
      files.push({
        placeholderId: block.media.uploaded.placeholderId,
        file,
      })
    }
  }

  return files
}

function resolveUploadedMediaOrThrow(params: {
  placeholderId: string
  uploadedFiles: Record<string, CreatePostUploadedMediaInput>
  errorMessage: string
}): CreatePostUploadedMediaInput {
  const uploaded = params.uploadedFiles[params.placeholderId]

  if (!uploaded) {
    throw new Error(params.errorMessage)
  }

  return uploaded
}

function replaceUploadedDraftPaths(params: {
  blocks: CreatePostClientDraftBlock[]
  uploadedFiles: Record<string, CreatePostUploadedMediaInput>
}): CreateOrEditPostFormBlock[] {
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
        items: block.items.map((item): CreatePostCarouselItem => {
          if (item.media.kind !== "uploaded") {
            return {
              type: item.type,
              media: createExistingFormMediaSource(item.media.mediaId),
              editorState: item.editorState,
            }
          }

          const uploaded = resolveUploadedMediaOrThrow({
            placeholderId: item.media.uploaded.placeholderId,
            uploadedFiles: params.uploadedFiles,
            errorMessage: "Uploaded carousel media mapping failed",
          })

          return {
            ...item,
            media: createUploadedFormMediaSource(uploaded),
          }
        }),
      }
    }

    if (block.media.kind !== "uploaded") {
      return {
        type: block.type,
        sortOrder,
        media: createExistingFormMediaSource(block.media.mediaId),
        editorState: block.editorState,
        content: block.content ?? null,
      }
    }

    const uploaded = resolveUploadedMediaOrThrow({
      placeholderId: block.media.uploaded.placeholderId,
      uploadedFiles: params.uploadedFiles,
      errorMessage: "Uploaded media mapping failed",
    })

    return {
      ...block,
      sortOrder,
      media: createUploadedFormMediaSource(uploaded),
    }
  })
}



export function CreatePostComposer({
  creatorId,
  onCreated,
}: CreatePostComposerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const errorPresentation = resolveCreatePostComposerErrorPresentation(error)

  return (
    <div className="space-y-4">
      {errorPresentation ? (
        <div className={errorPresentation.className}>
          {errorPresentation.message}
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
