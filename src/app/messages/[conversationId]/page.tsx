import Link from "next/link"
import { notFound } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import { getConversationById } from "@/modules/message/server/get-conversation-by-id"
import { listMessages } from "@/modules/message/server/list-messages"

type ConversationDetailPageProps = {
  params: Promise<{
    conversationId: string
  }>
}

export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const user = await requireUser()
  const { conversationId } = await params

  const conversation = await getConversationById({
    conversationId,
    userId: user.id,
  })

  if (!conversation) {
    notFound()
  }

  const messages = await listMessages({
    conversationId,
  })

  const participant = conversation.participant

  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col gap-4 px-4 py-6">
      <section className="flex items-center gap-4 rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white">
        <Link
          href="/messages"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-white/80 transition hover:bg-white/5"
        >
          Back
        </Link>

        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/80">
          {participant?.avatarUrl ? (
            <img
              src={participant.avatarUrl}
              alt={participant.displayName ?? "User"}
              className="h-full w-full object-cover"
            />
          ) : (
            (participant?.displayName ?? participant?.username ?? "U")
              .slice(0, 1)
              .toUpperCase()
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {participant?.displayName ?? "Unknown user"}
          </p>
          <p className="truncate text-xs text-white/50">
            @{participant?.username ?? "unknown"}
          </p>
        </div>
      </section>

      <section className="flex flex-1 flex-col rounded-2xl border border-white/10 bg-neutral-950 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6 py-12 text-center">
            <div>
              <p className="text-base font-medium text-white">No messages yet</p>
              <p className="mt-2 text-sm text-white/60">
                Start the conversation by sending your first message.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3">
            {messages.map((message) => {
              const isMine = message.senderId === user.id

              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isMine
                        ? "bg-white text-black"
                        : "border border-white/10 bg-white/5 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {message.content}
                    </p>

                    <p
                      className={`mt-2 text-xs ${
                        isMine ? "text-black/60" : "text-white/50"
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <form
          action={`/api/messages/${conversation.id}/send`}
          method="post"
          className="mt-4 border-t border-white/10 pt-4"
        >
          <input type="hidden" name="conversationId" value={conversation.id} />

          <div className="flex items-end gap-3">
            <textarea
              name="content"
              rows={3}
              placeholder="Write a message..."
              className="min-h-[88px] flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
            />

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}