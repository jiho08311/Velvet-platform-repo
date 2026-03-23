type PostComposerVisibility = "public" | "subscribers" | "paid"

type PostComposerProps = {
  text: string
  visibility: PostComposerVisibility
  disabled?: boolean
  placeholder?: string
  onTextChange: (value: string) => void
  onVisibilityChange: (value: PostComposerVisibility) => void
  onSubmit?: () => void
}

export function PostComposer({
  text,
  visibility,
  disabled = false,
  placeholder = "Write something for your audience...",
  onTextChange,
  onVisibilityChange,
  onSubmit,
}: PostComposerProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-950 p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="post-composer-text"
            className="text-sm font-medium text-white/80"
          >
            Post text
          </label>
          <textarea
            id="post-composer-text"
            value={text}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(event) => onTextChange(event.target.value)}
            rows={8}
            className="min-h-[220px] w-full resize-none rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-sm font-medium text-white/80">Visibility</span>
            <select
              value={visibility}
              disabled={disabled}
              onChange={(event) =>
                onVisibilityChange(
                  event.target.value as PostComposerVisibility
                )
              }
              className="h-11 rounded-xl border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="public">Public</option>
              <option value="subscribers">Subscribers</option>
              <option value="paid">Paid</option>
            </select>

            {/* ✅ 설명만 추가 (UX 개선) */}
            <p className="text-xs text-white/40">
              {visibility === "public" && "Anyone can view this post."}
              {visibility === "subscribers" &&
                "Only your subscribers can view this post."}
              {visibility === "paid" &&
                "Users must purchase this post to view it."}
            </p>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={disabled}
            onClick={onSubmit}
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Publish
          </button>
        </div>
      </div>
    </section>
  )
}