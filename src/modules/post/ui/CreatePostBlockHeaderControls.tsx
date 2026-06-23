type CreatePostBlockHeaderControlsProps = {
  canMoveUp: boolean
  canMoveDown: boolean
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}

export function CreatePostBlockHeaderControls({
  canMoveUp,
  canMoveDown,
  isDragging,
  onDragStart,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
}: CreatePostBlockHeaderControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm text-white transition hover:bg-zinc-800 ${
          isDragging ? "cursor-grabbing" : "cursor-grab active:cursor-grabbing"
        }`}
        aria-label="Drag block"
        title="Drag block"
      >
        ⋮⋮
      </button>

      <button
        type="button"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:opacity-30"
      >
        ↑
      </button>

      <button
        type="button"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:opacity-30"
      >
        ↓
      </button>

      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
        aria-label="Remove block"
      >
        ✕
      </button>
    </div>
  )
}
