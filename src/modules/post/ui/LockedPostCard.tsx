type LockedPostCardProps = {
  previewText: string
  createdAt: string
  previewThumbnailUrl?: string | null

  priceCents?: number
  lockReason?: "subscription" | "purchase"
  action?: React.ReactNode
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("ko-KR").format(amount)
}

export function LockedPostCard({
  previewText,
  createdAt,
  previewThumbnailUrl = null,
  priceCents,
  lockReason,
  action,
}: LockedPostCardProps) {
  const isPaid =
    lockReason === "purchase" &&
    typeof priceCents === "number" &&
    priceCents > 0

  return (
    <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 text-white">
      <div className="relative">
        {previewThumbnailUrl ? (
          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-950">
            <img
              src={previewThumbnailUrl}
              alt="Locked post preview"
              className="h-full w-full scale-[1.06] object-cover opacity-30 blur-md"
            />
            <div className="absolute inset-0 bg-black/55" />
          </div>
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center bg-zinc-950 text-sm text-zinc-500">
            Premium content
          </div>
        )}

        <div className="absolute left-4 top-4 inline-flex items-center rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
          Locked
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-xs">
            <p className="text-lg font-semibold text-white">
              Unlock this premium post
            </p>

            {isPaid ? (
              <p className="mt-2 text-base font-semibold text-white">
                ₩{formatPrice(priceCents)}
              </p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-zinc-200">
                Subscribe to view the full content.
              </p>
            )}

            {action ? <div className="mt-4">{action}</div> : null}
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
          {previewText}
        </p>

        <p className="mt-4 text-xs text-zinc-500">{createdAt}</p>
      </div>
    </article>
  )
}