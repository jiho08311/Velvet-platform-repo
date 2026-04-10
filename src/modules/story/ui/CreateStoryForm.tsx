"use client"

import { FormEvent, useRef, useState } from "react"
import { StoryVideoTrimField } from "@/modules/media/ui/StoryVideoTrimField"

type StoryVisibility = "public" | "subscribers"

type SubmitStoryInput = {
  text: string
  visibility: StoryVisibility
  file: File | null
  trim: {
    duration: number
    requiresTrim: boolean
    startTime: number
  }
}

type CreateStoryFormProps = {
  isSubmitting?: boolean
  onSubmitStory: (input: SubmitStoryInput) => void
}

export function CreateStoryForm({
  isSubmitting = false,
  onSubmitStory,
}: CreateStoryFormProps) {
  const [text, setText] = useState("")
  const [visibility, setVisibility] = useState<StoryVisibility>("subscribers")
  const [file, setFile] = useState<File | null>(null)
  const [trim, setTrim] = useState({
    duration: 0,
    requiresTrim: false,
    startTime: 0,
  })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmitStory({
      text,
      visibility,
      file,
      trim,
    })

    setText("")
    setVisibility("subscribers")
    setFile(null)
    setTrim({
      duration: 0,
      requiresTrim: false,
      startTime: 0,
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share a moment..."
        className="min-h-[120px] w-full resize-none bg-transparent text-white outline-none placeholder:text-zinc-500"
      />

      <StoryVideoTrimField file={file} onChange={setTrim} />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as StoryVisibility)}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white"
          >
            <option value="public">Public</option>
            <option value="subscribers">Subscribers</option>
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={(e) => {
              const nextFile = e.target.files?.[0] ?? null
              setFile(nextFile)
              setTrim({
                duration: 0,
                requiresTrim: false,
                startTime: 0,
              })
            }}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-lg text-white transition hover:bg-zinc-800"
            aria-label="Upload story file"
            title="Upload story file"
          >
            +
          </button>

          {file ? (
            <p className="max-w-[160px] truncate text-xs text-zinc-400">
              {file.name}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-pink-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-pink-500 disabled:opacity-50"
        >
          {isSubmitting ? "Posting..." : "Post story"}
        </button>
      </div>
    </form>
  )
}