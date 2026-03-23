// src/app/messages/page.tsx

import { getSession } from "@/modules/auth/server/get-session"
import { listConversations } from "@/modules/message/server/list-conversations"
import { ConversationList } from "@/modules/message/ui/ConversationList"

export default async function MessagesPage() {
  const session = await getSession()

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="mt-2 text-sm text-white/60">
            View your conversations and continue chatting with creators and fans.
          </p>
        </section>

        <ConversationList
          conversations={[]}
          emptyMessage="Sign in to view your messages."
        />
      </main>
    )
  }

  const conversations = await listConversations({
    userId: session.userId,
  })

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="mt-2 text-sm text-white/60">
          View your conversations and continue chatting with creators and fans.
        </p>
      </section>

      <ConversationList
        conversations={conversations.map((conversation) => ({
          id: conversation.id,
          participantName: conversation.participant.displayName,
          participantAvatarUrl: conversation.participant.avatarUrl,
          lastMessage: conversation.lastMessage?.content ?? "",
          lastMessageAt:
            conversation.lastMessage?.createdAt ?? conversation.updatedAt,
          participantUsername: conversation.participant.username,
        }))}
        emptyMessage="No conversations yet."
      />
    </main>
  )
}