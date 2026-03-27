"use client"

import { FormEvent, useRef, useState } from "react"

type PostVisibility = "public" | "subscribers" | "paid"

type SubmitPostInput = {
  text: string
  visibility: PostVisibility
  priceCents?: number
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
  const [priceCents, setPriceCents] = useState<number>(0)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmitPost({
      text,
      visibility,
      priceCents: visibility === "paid" ? priceCents : 0,
      files,
    })

    setText("")
    setVisibility("subscribers")
    setPriceCents(0)
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F472B6]">
            Create
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
            New post
          </h2>
        </div>

        <div className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
          Creator only
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="post-text"
          className="text-sm font-medium text-zinc-200"
        >
          Caption (optional)
        </label>
        <textarea
          id="post-text"
          name="text"
          rows={6}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Add a caption or upload media..."
          className="min-h-[180px] w-full resize-none rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="post-files"
          className="text-sm font-medium text-zinc-200"
        >
          Media
        </label>
        <input
          ref={fileInputRef}
          id="post-files"
          name="files"
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            const nextFiles = Array.from(event.target.files ?? [])
            setFiles(nextFiles)
          }}
          className="block w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
        />

        <p className="text-xs text-zinc-500">
          {files.length > 0
            ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
            : "Add images or leave empty if you're posting text only."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="post-visibility"
            className="text-sm font-medium text-zinc-200"
          >
            Access
          </label>
          <select
            id="post-visibility"
            name="visibility"
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as PostVisibility)
            }
            className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="public">Public</option>
            <option value="subscribers">Subscribers</option>
            <option value="paid">Paid post</option>
          </select>

          <p className="text-xs text-zinc-500">
            {visibility === "public" && "Anyone can view this post."}
            {visibility === "subscribers" &&
              "Only active subscribers can view this post."}
            {visibility === "paid" &&
              "Users must purchase this post to unlock it."}
          </p>
        </div>

        {visibility === "paid" ? (
          <div className="space-y-2">
            <label
              htmlFor="post-price"
              className="text-sm font-medium text-zinc-200"
            >
              Price (KRW)
            </label>
            <input
              id="post-price"
              name="priceCents"
              type="number"
              min={100}
              step={100}
              value={priceCents}
              onChange={(event) => setPriceCents(Number(event.target.value))}
              placeholder="예: 5000"
              className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
            />
            <p className="text-xs text-zinc-500">
              Paid posts are unlocked after purchase.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-4">
            <p className="text-sm font-medium text-white">
              {visibility === "public" ? "Open reach" : "Subscriber content"}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {visibility === "public"
                ? "Use this for discovery and profile growth."
                : "Use this for member-only content and retention."}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-4">
        <p className="text-xs text-zinc-500">
          You can publish with text, media, or both. Empty posts are not allowed.
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">
            {visibility === "paid"
              ? "This post will be published as premium content."
              : "Ready to publish this post."}
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#C2185B] px-5 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </form>
  )
}