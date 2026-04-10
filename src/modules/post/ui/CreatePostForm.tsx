"use client"

import { FormEvent, useRef, useState } from "react"

type PostVisibility = "public" | "subscribers"

type CreatePostBlockInput = {
  type: "text" | "image" | "video" | "audio" | "file"
  content?: string | null
  sortOrder: number
  mediaId?: string | null
}

type SubmitPostInput = {
  visibility: PostVisibility
  files: File[]
  blocks: CreatePostBlockInput[]
}

type CreatePostFormProps = {
  isSubmitting?: boolean
  onSubmitPost: (input: SubmitPostInput) => void
  initialTextBlocks?: string[]
  initialVisibility?: PostVisibility
  initialBlocks?: {
    type: "text" | "image" | "video"
    content?: string | null
    url?: string | null
    mediaId?: string | null
  }[]
}

type EditorBlock = {
  id: string
  type: "text" | "image" | "video"
  content?: string
  file?: File
  previewUrl?: string
  mediaId?: string
}

function createBlockId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function CreatePostForm({
  isSubmitting = false,
  onSubmitPost,
  initialTextBlocks,
  initialVisibility,
  initialBlocks,
}: CreatePostFormProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      return initialBlocks.map((b) => ({
        id: createBlockId(),
        type: b.type,
        content: b.type === "text" ? b.content ?? "" : undefined,
        previewUrl: b.url ?? undefined,
        mediaId: b.mediaId ?? undefined,
      }))
    }

    return (initialTextBlocks ?? [""]).map((content) => ({
      id: createBlockId(),
      type: "text",
      content,
    }))
  })

  const [visibility, setVisibility] = useState<PostVisibility>(
    initialVisibility ?? "subscribers"
  )
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function updateTextBlock(blockId: string, value: string) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, content: value } : block
      )
    )
  }

  function addTextBlock() {
    setBlocks((prev) => [
      ...prev,
      {
        id: createBlockId(),
        type: "text",
        content: "",
      },
    ])
  }

  function moveBlock(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return

    setBlocks((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  function moveBlockUp(index: number) {
    if (index === 0) return

    setBlocks((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveBlockDown(index: number) {
    setBlocks((prev) => {
      if (index === prev.length - 1) return prev

      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  function handleDragStart(blockId: string) {
    setDraggingBlockId(blockId)
  }

  function handleDragEnd() {
    setDraggingBlockId(null)
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
  }

  function handleDrop(targetBlockId: string) {
    if (!draggingBlockId || draggingBlockId === targetBlockId) {
      setDraggingBlockId(null)
      return
    }

    const fromIndex = blocks.findIndex((block) => block.id === draggingBlockId)
    const toIndex = blocks.findIndex((block) => block.id === targetBlockId)

    if (fromIndex === -1 || toIndex === -1) {
      setDraggingBlockId(null)
      return
    }

    moveBlock(fromIndex, toIndex)
    setDraggingBlockId(null)
  }

  function removeBlock(blockId: string) {
    setBlocks((prev) => {
      const next = prev.filter((block) => block.id !== blockId)
      return next.length > 0
        ? next
        : [{ id: createBlockId(), type: "text", content: "" }]
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function addMediaBlocks(nextFiles: File[]) {
    if (nextFiles.length === 0) return

    const nextBlocks: EditorBlock[] = nextFiles.map((file) => ({
      id: createBlockId(),
      type: file.type.startsWith("video/") ? "video" : "image",
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setBlocks((prev) => [...prev, ...nextBlocks])

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const submitBlocks: CreatePostBlockInput[] = blocks
      .filter((block) => {
        if (block.type === "text") {
          return (block.content ?? "").trim().length > 0
        }

        return Boolean(block.file || block.mediaId)
      })
      .map((block, index) => ({
        type: block.type,
        content: block.type === "text" ? block.content?.trim() ?? "" : null,
        sortOrder: index,
        mediaId: block.type !== "text" ? block.mediaId ?? null : null,
      }))

    const files = blocks
      .filter((block) => block.type !== "text" && block.file)
      .map((block) => block.file!)
      .filter((file) => file.size > 0)

    onSubmitPost({
      visibility,
      files,
      blocks: submitBlocks,
    })

    setBlocks([{ id: createBlockId(), type: "text", content: "" }])
    setVisibility("subscribers")
    setDraggingBlockId(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(block.id)}
            className={`space-y-3 rounded-[28px] border p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition ${
              draggingBlockId === block.id
                ? "border-pink-500/60 bg-zinc-900/80"
                : "border-zinc-800/80 bg-zinc-950/50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                {block.type === "text"
                  ? "Text block"
                  : block.type === "video"
                    ? "Video block"
                    : "Image block"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  draggable
                  onDragStart={() => handleDragStart(block.id)}
                  onDragEnd={handleDragEnd}
                  className="inline-flex h-9 w-9 cursor-grab items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm text-white transition hover:bg-zinc-800 active:cursor-grabbing"
                  aria-label="Drag block"
                  title="Drag block"
                >
                  ⋮⋮
                </button>

                <button
                  type="button"
                  onClick={() => moveBlockUp(index)}
                  disabled={index === 0}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:opacity-30"
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={() => moveBlockDown(index)}
                  disabled={index === blocks.length - 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:opacity-30"
                >
                  ↓
                </button>

                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                  aria-label="Remove block"
                >
                  ✕
                </button>
              </div>
            </div>

            {block.type === "text" ? (
              <textarea
                value={block.content ?? ""}
                onChange={(e) => updateTextBlock(block.id, e.target.value)}
                placeholder="Write a caption, tell a story, or set the mood for the next block..."
                className="min-h-[220px] w-full resize-none rounded-[24px] border border-pink-500/20 bg-white px-5 py-4 text-[17px] leading-8 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
                autoFocus={index === 0 && block.type === "text"}
              />
            ) : (
              <div className="group relative overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-900">
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="absolute right-3 top-3 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 group-hover:flex"
                >
                  ✕
                </button>

                <div className="aspect-[4/5] w-full overflow-hidden bg-zinc-950">
                  {block.type === "video" ? (
                    <video
                      src={block.previewUrl}
                      controls
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={block.previewUrl}
                      alt="Selected media"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-[24px] border border-zinc-800/80 bg-zinc-950/50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as PostVisibility)}
            className="h-12 rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-white outline-none transition hover:bg-zinc-800 focus:border-pink-500"
          >
            <option value="public">Public</option>
            <option value="subscribers">Subscribers</option>
          </select>

          <button
            type="button"
            onClick={addTextBlock}
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-5 text-sm font-medium text-white transition hover:border-zinc-600 hover:bg-zinc-800"
          >
            Add text
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => {
              const nextFiles = Array.from(e.target.files ?? []).filter(
                (file) =>
                  file.type.startsWith("image/") || file.type.startsWith("video/")
              )

              addMediaBlocks(nextFiles)
            }}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-pink-500/30 bg-pink-500/10 text-lg text-pink-300 transition hover:bg-pink-500/20"
            aria-label="Upload files"
            title="Upload files"
          >
            +
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center rounded-full bg-pink-600 px-6 text-sm font-semibold text-white transition hover:bg-pink-500 disabled:opacity-50"
        >
          {isSubmitting ? "Publishing..." : "Publish"}
        </button>
      </div>
    </form>
  )
}