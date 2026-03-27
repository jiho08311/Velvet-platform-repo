type LockedPostCardProps = {
  previewText: string
  createdAt: string
  previewThumbnailUrl?: string | null

  ctaLabel: string
  onClick: () => void

  priceCents?: number
  lockReason?: "subscription" | "purchase"
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("ko-KR").format(amount)
}

export function LockedPostCard({
  previewText,
  createdAt,
  previewThumbnailUrl = null,
  ctaLabel,
  onClick,
  priceCents,
  lockReason,
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

            <button
              type="button"
              onClick={onClick}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#C2185B] px-5 text-sm font-semibold text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
            >
              {isPaid ? `Unlock ₩${formatPrice(priceCents)}` : ctaLabel}
            </button>
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