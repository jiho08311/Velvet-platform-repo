import { Button } from "@/shared/ui/Button"
import { resolvePostComposerSubmitCTA } from "./post-composer-ui-state"

type PostComposerVisibility = "public" | "subscribers"

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
  const submitCTA = resolvePostComposerSubmitCTA({
    disabled,
  })

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
            </select>

            <p className="text-xs text-white/40">
              {visibility === "public" && "Anyone can view this post."}
              {visibility === "subscribers" &&
                "Only your subscribers can view this post."}
            </p>
          </label>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={submitCTA.disabled}
            onClick={onSubmit}
            className="min-h-[44px] border border-white/10 bg-white px-5 font-medium text-black hover:bg-white/90"
          >
            {submitCTA.label}
          </Button>
        </div>
      </div>
    </section>
  )
}
