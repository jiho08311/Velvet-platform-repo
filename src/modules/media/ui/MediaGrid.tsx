type MediaGridItem = {
  id: string
  type: "image" | "video"
  thumbnailUrl: string | null
  alt?: string
}

type MediaGridProps = {
  items: MediaGridItem[]
  emptyMessage?: string
}

export function MediaGrid({
  items,
  emptyMessage = "No media available.",
}: MediaGridProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
        {emptyMessage}
      </section>
    )
  }

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950"
        >
          <div className="aspect-square bg-white/5">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.alt ?? `${item.type} thumbnail`}
                className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-white/35">
                No preview
              </div>
            )}
          </div>

          {item.type === "video" ? (
            <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              Video
            </div>
          ) : null}
        </article>
      ))}
    </section>
  )
}