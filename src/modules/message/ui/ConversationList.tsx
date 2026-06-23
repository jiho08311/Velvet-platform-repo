// src/modules/message/ui/ConversationList.tsx

import Link from "next/link"
import type { ConversationSummaryViewModel } from "@/modules/message/types"

type ConversationListItem = ConversationSummaryViewModel & {
  isSelected?: boolean
}

type ConversationListProps = {
  conversations: ConversationListItem[]
  emptyMessage?: string
}

export function ConversationList({
  conversations,
  emptyMessage = "No conversations yet.",
}: ConversationListProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950">
      {conversations.length === 0 ? (
        <div className="p-8 text-center text-sm text-white/60">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {conversations.map((conversation) => {
            const displayTimestamp =
              conversation.lastMessage?.createdAt ?? conversation.updatedAt
            const unreadCount = conversation.unreadCount ?? 0

            return (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.id}`}
                className={`flex w-full items-center gap-4 px-4 py-4 text-left transition ${
                  conversation.isSelected
                    ? "bg-white/10"
                    : "bg-transparent hover:bg-white/5"
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                  {conversation.participant?.avatarUrl ? (
                    <img
                      src={conversation.participant.avatarUrl}
                      alt={conversation.participant.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-white/70">
                      {(conversation.participant?.displayName ?? "U")
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-medium text-white">
                      {conversation.participant?.displayName ?? "Unknown user"}
                    </p>

                    <div className="flex shrink-0 items-center gap-2">
                      {unreadCount > 0 ? (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#C2185B] px-1.5 py-0.5 text-xs font-semibold text-white">
                          {unreadCount}
                        </span>
                      ) : null}

                      <span className="text-xs text-white/45">
                        {displayTimestamp}
                      </span>
                    </div>
                  </div>

                  <p className="mt-1 truncate text-sm text-white/60">
                    {conversation.lastMessage?.content ?? ""}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}