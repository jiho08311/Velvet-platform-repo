"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { createFeedPostAction } from "@/modules/post/public/create-feed-post-action"
import { uploadFeedComposerMedia } from "@/modules/media/public/upload-feed-composer-media"
import { Card } from "@/shared/ui/Card"
import type { CreatePostUploadedMediaInput } from "@/modules/post/types"
import { resolveComposerCTA } from "@/shared/ui/cta-state"
import { FeedComposerActionBar } from "./FeedComposerActionBar"
import { FeedComposerPreviewGrid } from "./FeedComposerPreviewGrid"
import {
  createFeedComposerFileItem,
  isSupportedFeedComposerFile,
  type FeedComposerFileItem,
  type FeedComposerVisibility,
} from "./feed-composer-model"
import { clientLogger } from "@/shared/observability/client-logger"

type FeedComposerProps = {
  placeholder?: string
  userId: string
}

const feedComposerClassNames = {
  card: "p-4",
  textarea:
    "w-full resize-none overflow-hidden bg-transparent text-sm text-white outline-none placeholder:text-zinc-500",
}

async function uploadFilesDirect(
  files: File[],
  uploaderUserId: string
): Promise<CreatePostUploadedMediaInput[]> {
  return uploadFeedComposerMedia({ files, uploaderUserId })
}

export function FeedComposer({
  placeholder = "Share something...",
  userId,
}: FeedComposerProps) {
  const [text, setText] = useState("")
  const [visibility, setVisibility] =
    useState<FeedComposerVisibility>("subscribers")
  const [selectedItems, setSelectedItems] = useState<FeedComposerFileItem[]>([])
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fileInputRef = useRef<HTMLInputElement>(null)
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

    const nextFiles = files.filter(isSupportedFeedComposerFile)

    if (nextFiles.length === 0) return

    const nextItems = nextFiles.map(createFeedComposerFileItem)

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
          selectedItems.map((item) => item.file),
          userId
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
        clientLogger.error({
          event: "feed.composer_submit_failed",
          context: { userId },
          error,
        })
      }
    })
  }

  const isDisabled = !text.trim() && selectedItems.length === 0
  const cta = resolveComposerCTA({
    loading: isPending,
    disabled: isDisabled,
  })

  return (
    <Card className={feedComposerClassNames.card}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        className={feedComposerClassNames.textarea}
        rows={1}
      />

      <FeedComposerPreviewGrid
        items={selectedItems}
        draggingItemId={draggingItemId}
        onRemove={removeItem}
        onDragStart={setDraggingItemId}
        onDragEnd={() => setDraggingItemId(null)}
        onDropItem={moveItem}
      />

      <FeedComposerActionBar
        visibility={visibility}
        selectedItemCount={selectedItems.length}
        fileInputRef={fileInputRef}
        cta={cta}
        onVisibilityChange={setVisibility}
        onFilesChange={handleFilesChange}
        onClearFiles={clearFiles}
        onSubmit={handleSubmit}
      />
    </Card>
  )
}
