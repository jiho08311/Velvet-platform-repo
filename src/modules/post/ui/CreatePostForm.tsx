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
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full"
      />

      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as PostVisibility)}
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
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Publishing..." : "Publish"}
      </button>
    </form>
  )
}