"use client"

import type { FeedComposerFileItem } from "./feed-composer-model"

type FeedComposerPreviewGridProps = {
  items: FeedComposerFileItem[]
  draggingItemId: string | null
  onRemove: (itemId: string) => void
  onDragStart: (itemId: string) => void
  onDragEnd: () => void
  onDropItem: (fromId: string, toId: string) => void
}

export function FeedComposerPreviewGrid({
  items,
  draggingItemId,
  onRemove,
  onDragStart,
  onDragEnd,
  onDropItem,
}: FeedComposerPreviewGridProps) {
  const count = items.length

  if (count === 0) return null

  if (count === 1) {
    return (
      <div className="mt-3">
        <PreviewItem
          item={items[0]}
          isLarge
          onRemove={onRemove}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDropItem={onDropItem}
          draggingItemId={draggingItemId}
        />
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.map((item) => (
          <PreviewItem
            key={item.id}
            item={item}
            onRemove={onRemove}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDropItem={onDropItem}
            draggingItemId={draggingItemId}
          />
        ))}
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="col-span-1">
          <PreviewItem
            item={items[0]}
            isTall
            onRemove={onRemove}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDropItem={onDropItem}
            draggingItemId={draggingItemId}
          />
        </div>

        <div className="col-span-1 grid grid-rows-2 gap-2">
          {items.slice(1, 3).map((item) => (
            <PreviewItem
              key={item.id}
              item={item}
              onRemove={onRemove}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDropItem={onDropItem}
              draggingItemId={draggingItemId}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {items.slice(0, 4).map((item, index) => (
        <div key={item.id} className="relative">
          <PreviewItem
            item={item}
            onRemove={onRemove}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDropItem={onDropItem}
            draggingItemId={draggingItemId}
          />

          {index === 3 && count > 4 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/55 text-lg font-semibold text-white">
              +{count - 4}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

type PreviewItemProps = {
  item: FeedComposerFileItem
  onRemove: (itemId: string) => void
  onDragStart: (itemId: string) => void
  onDragEnd: () => void
  onDropItem: (fromId: string, toId: string) => void
  draggingItemId: string | null
  isLarge?: boolean
  isTall?: boolean
}

function PreviewItem({
  item,
  onRemove,
  onDragStart,
  onDragEnd,
  onDropItem,
  draggingItemId,
  isLarge = false,
  isTall = false,
}: PreviewItemProps) {
  const aspectClassName = isLarge
    ? "aspect-[16/10]"
    : isTall
      ? "aspect-[4/5]"
      : "aspect-square"

  return (
    <div
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => {
        if (!draggingItemId) return
        onDropItem(draggingItemId, item.id)
      }}
      className={`group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 ${
        draggingItemId === item.id ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-100 transition hover:bg-black/85"
      >
        ✕
      </button>

      <div className={`${aspectClassName} w-full overflow-hidden bg-zinc-950`}>
        {item.file.type.startsWith("video/") ? (
          <video
            src={item.previewUrl}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
        ) : (
          <img
            src={item.previewUrl}
            alt="Preview"
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </div>
  )
}
