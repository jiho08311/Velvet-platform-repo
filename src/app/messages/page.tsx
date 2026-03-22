import { getSession } from "@/modules/auth/server/get-session"
import { getThreads } from "@/modules/message/server/get-threads"
import { ThreadList } from "@/modules/message/ui/ThreadList"

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

        <ThreadList threads={[]} emptyMessage="Sign in to view your messages." />
      </main>
    )
  }

  const threads = await getThreads({
    viewerUserId: session.userId,
    limit: 20,
  })

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="mt-2 text-sm text-white/60">
          View your conversations and continue chatting with creators and fans.
        </p>
      </section>

      <ThreadList
        threads={threads.items.map((thread) => ({
          id: thread.id,
          participantName: thread.participant.displayName,
          participantAvatarUrl: thread.participant.avatarUrl,
          lastMessage: thread.lastMessage?.content ?? "",
          lastMessageAt: thread.lastMessage?.createdAt ?? thread.updatedAt,
          participantUsername: thread.participant.username,
        }))}
        emptyMessage="No conversations yet."
      />
    </main>
  )
}