type MessageComposerProps = {
  value: string
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
  onSend?: () => void
  onSubmit?: () => void
}

export function MessageComposer({
  value,
  placeholder = "Write a message...",
  disabled = false,
  onChange,
  onSend,
  onSubmit,
}: MessageComposerProps) {
  const handleSubmit = () => {
    onSubmit?.()
    onSend?.()
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950 p-3">
      <div className="flex items-end gap-3">
        <textarea
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={1}
          className="min-h-[48px] flex-1 resize-none rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
        />

        <button
          type="button"
          disabled={disabled}
          onClick={handleSubmit}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  )
}