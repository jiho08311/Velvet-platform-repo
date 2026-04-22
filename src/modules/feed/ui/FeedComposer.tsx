"use client"

import { Button } from "@/shared/ui/Button"
import { useEffect, useRef, useState, useTransition } from "react"
import { createFeedPostAction } from "@/modules/post/server/create-feed-post-action"
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client"
import { Card } from "@/shared/ui/Card"
import type { CreatePostUploadedMediaInput } from "@/modules/post/types"
import { resolveComposerCTA } from "@/shared/ui/cta-state"
import { FEED_COMPOSER_ACTIONS } from "./feed-surface-policy"

type FeedComposerProps = {
  placeholder?: string
  userId: string
}

type ComposerFileItem = {
  id: string
  file: File
  previewUrl: string
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

function createFileItem(file: File): ComposerFileItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    file,
    previewUrl: URL.createObjectURL(file),
  }
}

async function uploadFilesDirect(
  files: File[]
): Promise<CreatePostUploadedMediaInput[]> {
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

export function FeedComposer({
  placeholder = "Share something...",
  userId,
}: FeedComposerProps) {
  const [text, setText] = useState("")
  const [visibility, setVisibility] = useState<"public" | "subscribers">(
    "subscribers"
  )
  const [selectedItems, setSelectedItems] = useState<ComposerFileItem[]>([])
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    return () => {
      selectedItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [selectedItems])

  function resizeTextarea() {
    if (!textareaRef.current) return
    textareaRef.current.style.height = "auto"
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
  }

  function handleTextChange(value: string) {
    setText(value)
    requestAnimationFrame(resizeTextarea)
  }

  function handleFilesChange(files: File[]) {
    if (files.length === 0) return

    const nextFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") || file.type.startsWith("video/")
    )

    if (nextFiles.length === 0) return

    const nextItems = nextFiles.map(createFileItem)

    setSelectedItems((prev) => [...prev, ...nextItems])

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function clearFiles() {
    selectedItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    setSelectedItems([])
    setDraggingItemId(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function removeItem(itemId: string) {
    setSelectedItems((prev) => {
      const target = prev.find((item) => item.id === itemId)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((item) => item.id !== itemId)
    })
  }

  function moveItem(fromId: string, toId: string) {
    if (fromId === toId) return

    setSelectedItems((prev) => {
      const fromIndex = prev.findIndex((item) => item.id === fromId)
      const toIndex = prev.findIndex((item) => item.id === toId)

      if (fromIndex === -1 || toIndex === -1) return prev

      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  function handleSubmit() {
    if ((!text.trim() && selectedItems.length === 0) || isPending) return

    startTransition(async () => {
      try {
        const uploadedFiles = await uploadFilesDirect(
          selectedItems.map((item) => item.file)
        )

        await createFeedPostAction({
          text,
          visibility,
          userId,
          files: uploadedFiles,
        })

        setText("")
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto"
        }
        clearFiles()
      } catch (error) {
        console.error(error)
      }
    })
  }

  const isDisabled = !text.trim() && selectedItems.length === 0
  const cta = resolveComposerCTA({
    loading: isPending,
    disabled: isDisabled,
  })

  function renderPreviewGrid() {
    const count = selectedItems.length

    if (count === 0) return null

    if (count === 1) {
      const item = selectedItems[0]

      return (
        <div className="mt-3">
          <PreviewItem
            item={item}
            isLarge
            onRemove={removeItem}
            onDragStart={setDraggingItemId}
            onDragEnd={() => setDraggingItemId(null)}
            onDropItem={moveItem}
            draggingItemId={draggingItemId}
          />
        </div>
      )
    }

    if (count === 2) {
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {selectedItems.map((item) => (
            <PreviewItem
              key={item.id}
              item={item}
              onRemove={removeItem}
              onDragStart={setDraggingItemId}
              onDragEnd={() => setDraggingItemId(null)}
              onDropItem={moveItem}
              draggingItemId={draggingItemId}
            />
          ))}
        </div>
      )
    }

    if (count === 3) {
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="col-span-1">
            <PreviewItem
              item={selectedItems[0]}
              isTall
              onRemove={removeItem}
              onDragStart={setDraggingItemId}
              onDragEnd={() => setDraggingItemId(null)}
              onDropItem={moveItem}
              draggingItemId={draggingItemId}
            />
          </div>

          <div className="col-span-1 grid grid-rows-2 gap-2">
            {selectedItems.slice(1, 3).map((item) => (
              <PreviewItem
                key={item.id}
                item={item}
                onRemove={removeItem}
                onDragStart={setDraggingItemId}
                onDragEnd={() => setDraggingItemId(null)}
                onDropItem={moveItem}
                draggingItemId={draggingItemId}
              />
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {selectedItems.slice(0, 4).map((item, index) => (
          <div key={item.id} className="relative">
            <PreviewItem
              item={item}
              onRemove={removeItem}
              onDragStart={setDraggingItemId}
              onDragEnd={() => setDraggingItemId(null)}
              onDropItem={moveItem}
              draggingItemId={draggingItemId}
            />

            {index === 3 && count > 4 ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/55 text-lg font-semibold text-white">
                +{count - 4}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="p-4">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none overflow-hidden bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
        rows={1}
      />

      {renderPreviewGrid()}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as "public" | "subscribers")
            }
            className="h-11 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-white"
          >
            <option value="public">
              {FEED_COMPOSER_ACTIONS.visibilityPublicLabel}
            </option>
            <option value="subscribers">
              {FEED_COMPOSER_ACTIONS.visibilitySubscribersLabel}
            </option>
          </select>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) =>
              handleFilesChange(Array.from(e.target.files ?? []))
            }
            className="hidden"
          />

          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            {FEED_COMPOSER_ACTIONS.attachLabel}
          </Button>

          {selectedItems.length > 0 ? (
            <Button
              variant="secondary"
              onClick={clearFiles}
            >
              {FEED_COMPOSER_ACTIONS.clearLabel}
            </Button>
          ) : null}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={cta.primary.disabled}
          loading={cta.primary.loading}
          loadingLabel={cta.primary.loadingLabel}
        >
          {cta.primary.label}
        </Button>
      </div>
    </Card>
  )
}

type PreviewItemProps = {
  item: ComposerFileItem
  onRemove: (itemId: string) => void
  onDragStart: (itemId: string) => void
  onDragEnd: () => void
  onDropItem: (fromId: string, toId: string) => void
  draggingItemId: string | null
  isLarge?: boolean
  isTall?: boolean
}

function PreviewItem({
  item,
  onRemove,
  onDragStart,
  onDragEnd,
  onDropItem,
  draggingItemId,
  isLarge = false,
  isTall = false,
}: PreviewItemProps) {
  const aspectClassName = isLarge
    ? "aspect-[16/10]"
    : isTall
      ? "aspect-[4/5]"
      : "aspect-square"

  return (
    <div
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => {
        if (!draggingItemId) return
        onDropItem(draggingItemId, item.id)
      }}
      className={`group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 ${
        draggingItemId === item.id ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-100 transition hover:bg-black/85"
      >
        ✕
      </button>

      <div className={`${aspectClassName} w-full overflow-hidden bg-zinc-950`}>
        {item.file.type.startsWith("video/") ? (
          <video
            src={item.previewUrl}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
        ) : (
          <img
            src={item.previewUrl}
            alt="Preview"
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </div>
  )
}