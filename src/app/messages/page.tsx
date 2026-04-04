// src/app/messages/page.tsx
import { redirect } from "next/navigation"
import { Card } from "@/shared/ui/Card"
import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import { listConversations } from "@/modules/message/server/list-conversations"
import { ConversationList } from "@/modules/message/ui/ConversationList"
import { getOrCreateConversation } from "@/modules/message/server/get-or-create-conversation"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type MessagesPageProps = {
  searchParams: Promise<{
    creatorId?: string
  }>
}

type ProfileRow = {
  username: string | null
}

export default async function MessagesPage({
  searchParams,
}: MessagesPageProps) {
  let user: Awaited<ReturnType<typeof requireActiveUser>>

  try {
    user = await requireActiveUser()
  } catch {
    redirect("/sign-in?next=/messages")
  }

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect("/verify-pass")
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>()

  if (profileError) {
    throw profileError
  }

  if (!profile?.username) {
    redirect("/onboarding")
  }

  const { creatorId } = await searchParams

  if (creatorId) {
    const creator = await getCreatorByUserId(creatorId)

    if (creator) {
      const conversation = await getOrCreateConversation({
        userAId: user.id,
        userBId: creator.userId,
      })

      redirect(`/messages/${conversation.id}`)
    }
  }

  const conversations = await listConversations({
    userId: user.id,
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