"use client"

import { FormEvent, useRef, useState } from "react"

type PostVisibility = "public" | "subscribers"

type SubmitPostInput = {
  text: string
  visibility: PostVisibility
  files: File[]
}

type CreatePostFormProps = {
  isSubmitting?: boolean
  onSubmitPost: (input: SubmitPostInput) => void
}

export function CreatePostForm({
  isSubmitting = false,
  onSubmitPost,
}: CreatePostFormProps) {
  const [text, setText] = useState("")
  const [visibility, setVisibility] = useState<PostVisibility>("subscribers")
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmitPost({
      text,
      visibility,
      files,
    })

    setText("")
    setVisibility("subscribers")
    setFiles([])

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share something with your fans..."
        className="min-h-[180px] w-full resize-none bg-transparent text-white outline-none placeholder:text-zinc-500"
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as PostVisibility)}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white"
          >
            <option value="public">Public</option>
            <option value="subscribers">Subscribers</option>
          </select>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => {
              const nextFiles = Array.from(e.target.files ?? [])
              setFiles(nextFiles)
            }}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-lg text-white transition hover:bg-zinc-800"
            aria-label="Upload files"
            title="Upload files"
          >
            +
          </button>

          {files.length > 0 ? (
            <p className="text-xs text-zinc-400">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-pink-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-pink-500 disabled:opacity-50"
        >
          {isSubmitting ? "Publishing..." : "Publish"}
        </button>
      </div>
    </form>
  )
}