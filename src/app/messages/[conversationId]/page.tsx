import Link from "next/link"
import { notFound } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getConversationById } from "@/modules/message/server/get-conversation-by-id"
import { listMessages } from "@/modules/message/server/list-messages"
import { MessagePurchaseButton } from "@/modules/message/ui/MessagePurchaseButton"
import { MessageComposerSection } from "@/modules/message/ui/MessageComposerSection"

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
    userId: user.id, // 🔥 핵심 수정
  })

  const participant = conversation.participant
  const meAsCreator = await getCreatorByUserId(user.id)
  const canSendPpv = Boolean(meAsCreator)

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
                    {message.isLocked ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-70">
                            PPV message
                          </p>
                          <p className="mt-2 text-sm opacity-80">
                            Unlock this message to view the content.
                          </p>
                        </div>

                        {message.price ? (
                          <p className="text-sm font-medium">
                            ₩{message.price.toLocaleString()}
                          </p>
                        ) : null}

                        {!isMine ? (
                          <MessagePurchaseButton messageId={message.id} />
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {message.content ? (
                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {message.content}
                          </p>
                        ) : null}

                        {message.media.length > 0 ? (
                          <div className="space-y-3">
                            {message.media.map((media) =>
                              media.type === "image" ? (
                                <img
                                  key={media.id}
                                  src={media.url}
                                  alt=""
                                  className="w-full rounded-xl object-cover"
                                />
                              ) : (
                                <video
                                  key={media.id}
                                  src={media.url}
                                  controls
                                  playsInline
                                  preload="metadata"
                                  className="w-full rounded-xl"
                                />
                              )
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}

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

        <div className="mt-4 border-t border-white/10 pt-4">
          <MessageComposerSection conversationId={conversation.id} />
        </div>
      </section>
    </main>
  )
}