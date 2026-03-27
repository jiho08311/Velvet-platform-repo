import { redirect } from "next/navigation"
import { Card } from "@/shared/ui/Card"
import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { getSession } from "@/modules/auth/server/get-session"
import { listConversations } from "@/modules/message/server/list-conversations"
import { ConversationList } from "@/modules/message/ui/ConversationList"

export default async function MessagesPage() {
  const session = await getSession()

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold text-white">Messages</h1>
          <p className="mt-2 text-sm text-zinc-400">
            View your conversations and continue chatting with creators and fans.
          </p>
        </Card>

        <ConversationList
          conversations={[]}
          emptyMessage="Sign in to view your messages."
        />
      </main>
    )
  }

  try {
    await assertPassVerified({ profileId: session.userId })
  } catch {
    redirect("/verify-pass")
  }

  const conversations = await listConversations({
    userId: session.userId,
  })

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold text-white">Messages</h1>
        <p className="mt-2 text-sm text-zinc-400">
          View your conversations and continue chatting with creators and fans.
        </p>
      </Card>

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