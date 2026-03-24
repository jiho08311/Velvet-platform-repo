"use client"

import { FormEvent, useState } from "react"

type PostVisibility = "public" | "subscribers" | "paid"

type SubmitPostInput = {
  text: string
  visibility: PostVisibility
  priceCents?: number
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmitPost({
      text,
      visibility,
      priceCents: visibility === "paid" ? priceCents : 0,
    })

    setText("")
    setVisibility("subscribers")
    setPriceCents(0)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="post-text"
          className="text-sm font-medium text-white/80"
        >
          Post text
        </label>
        <textarea
          id="post-text"
          name="text"
          rows={6}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write something for your audience..."
          className="min-h-[180px] w-full resize-none rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="post-visibility"
          className="text-sm font-medium text-white/80"
        >
          Visibility
        </label>
        <select
          id="post-visibility"
          name="visibility"
          value={visibility}
          onChange={(event) =>
            setVisibility(event.target.value as PostVisibility)
          }
          className="rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="public">Public</option>
          <option value="subscribers">Subscribers</option>
          <option value="paid">Paid post</option>
        </select>
      </div>

      {visibility === "paid" ? (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="post-price"
            className="text-sm font-medium text-white/80"
          >
            PPV 가격 (원)
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
            className="rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <p className="text-sm text-white/55">
          {visibility === "paid"
            ? "유료 게시글로 발행됩니다."
            : "Ready to publish this post."}
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Publishing..." : "Publish"}
        </button>
      </div>
    </form>
  )
}