"use client"

import { useEffect, useRef, useState, useTransition } from "react"

import type { Story, StoryEditorState } from "../types"
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client"
import { updateStoryAction } from "../server/update-story-action"
import { deleteStoryAction } from "../server/delete-story-action"

type EditStoryModalProps = {
  open: boolean
  stories: Story[]
  onClose: () => void
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

export function EditStoryModal({
  open,
  stories,
  onClose,
}: EditStoryModalProps) {
  const latestStory = stories[stories.length - 1] ?? null

  const [text, setText] = useState(latestStory?.text ?? "")
  const [editorState, setEditorState] = useState<StoryEditorState | null>(
    latestStory?.editorState ?? null
  )
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open || !latestStory) return

    setText(latestStory.text ?? "")
    setEditorState(latestStory.editorState ?? null)
    setFile(null)
    setError(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [open, latestStory?.id])

  if (!open || !latestStory) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-4">
          <p className="text-sm font-semibold text-white">Edit story</p>
          <p className="mt-1 text-xs text-zinc-400">
            최신 스토리 1개만 수정합니다.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Edit your story..."
            className="min-h-[120px] w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null
              setFile(nextFile)
            }}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Replace media
            </button>

            {file ? (
              <p className="max-w-[180px] truncate text-xs text-zinc-400">
                {file.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  try {
                    setError(null)

                    let nextStoragePath: string | null | undefined = undefined

                    if (file) {
                      if (
                        !file.type.startsWith("image/") &&
                        !file.type.startsWith("video/")
                      ) {
                        throw new Error("Only image or video files are allowed")
                      }

                      nextStoragePath = await uploadStoryFile(file)
                    }

                    await updateStoryAction({
                      storyId: latestStory.id,
                      text,
                      storagePath: nextStoragePath,
                      editorState,
                    })

                    onClose()
                  } catch (submitError) {
                    if (submitError instanceof Error) {
                      setError(submitError.message)
                      return
                    }

                    setError("Failed to update story")
                  }
                })
              }}
              className="w-full rounded-2xl bg-pink-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-pink-500 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  try {
                    setError(null)
                    await deleteStoryAction({
                      storyId: latestStory.id,
                    })
                    onClose()
                  } catch (submitError) {
                    if (submitError instanceof Error) {
                      setError(submitError.message)
                      return
                    }

                    setError("Failed to delete story")
                  }
                })
              }}
              className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              {isPending ? "Deleting..." : "Delete story"}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}