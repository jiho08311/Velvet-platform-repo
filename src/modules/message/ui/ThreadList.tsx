type ThreadListItem = {
  id: string
  participantName: string
  participantAvatarUrl: string | null
  lastMessage: string
  lastMessageAt: string
  isSelected?: boolean
}

type ThreadListProps = {
  threads: ThreadListItem[]
  emptyMessage?: string
  onSelectThread?: (threadId: string) => void
}

export function ThreadList({
  threads,
  emptyMessage = "No conversations yet.",
  onSelectThread,
}: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
        {emptyMessage}
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950">
      <div className="divide-y divide-white/10">
        {threads.map((thread) => (
          <button
            key={thread.id}
            type="button"
            onClick={() => onSelectThread?.(thread.id)}
            className={`flex w-full items-center gap-4 px-4 py-4 text-left transition ${
              thread.isSelected
                ? "bg-white/10"
                : "bg-transparent hover:bg-white/5"
            }`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
              {thread.participantAvatarUrl ? (
                <img
                  src={thread.participantAvatarUrl}
                  alt={thread.participantName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-white/70">
                  {thread.participantName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="truncate text-sm font-medium text-white">
                  {thread.participantName}
                </p>
                <span className="shrink-0 text-xs text-white/45">
                  {thread.lastMessageAt}
                </span>
              </div>

              <p className="mt-1 truncate text-sm text-white/60">
                {thread.lastMessage}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}