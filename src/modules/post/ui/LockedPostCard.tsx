type LockedPostCardProps = {
  previewText: string
  createdAt: string
  previewThumbnailUrl?: string | null
  unlockLabel: string
}

export function LockedPostCard({
  previewText,
  createdAt,
  previewThumbnailUrl = null,
  unlockLabel,
}: LockedPostCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 text-white shadow-sm">
      <div className="relative border-b border-white/10 bg-black/40">
        {previewThumbnailUrl ? (
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={previewThumbnailUrl}
              alt="Locked post preview"
              className="h-full w-full object-cover opacity-40 blur-sm"
            />
            <div className="absolute inset-0 bg-black/35" />
          </div>
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center bg-white/5 text-sm text-white/35">
            Locked preview
          </div>
        )}

        <div className="absolute left-4 top-4 inline-flex items-center rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur-sm">
          Locked
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            {unlockLabel}
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-white/70">
          {previewText}
        </p>

        <p className="mt-4 text-xs text-white/45">{createdAt}</p>
      </div>
    </article>
  )
}