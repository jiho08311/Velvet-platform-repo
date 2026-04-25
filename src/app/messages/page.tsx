import { redirect } from "next/navigation"
import { Card } from "@/shared/ui/Card"
import {
  assertPassVerified,
  getPassVerificationRedirectPath,
} from "@/modules/auth/server/assert-pass-verified"
import {
  buildPathWithNext,
  ONBOARDING_PATH,
  SIGN_IN_PATH,
} from "@/modules/auth/lib/redirect-handoff"
import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import { listConversations } from "@/modules/message/server/list-conversations"
import { ConversationList } from "@/modules/message/ui/ConversationList"
import { getOrCreateConversation } from "@/modules/message/server/get-or-create-conversation"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type MessagesPageProps = {
  searchParams: Promise<{
    creatorId?: string
    userId?: string
  }>
}

type ProfileRow = {
  username: string | null
}

export default async function MessagesPage({
  searchParams,
}: MessagesPageProps) {
  const { creatorId, userId } = await searchParams
  const nextSearchParams = new URLSearchParams()

  if (creatorId) {
    nextSearchParams.set("creatorId", creatorId)
  }

  if (userId) {
    nextSearchParams.set("userId", userId)
  }

  const nextQuery = nextSearchParams.toString()
  const nextPath = nextQuery ? `/messages?${nextQuery}` : "/messages"
  let user: Awaited<ReturnType<typeof requireActiveUser>>

  try {
    user = await requireActiveUser()
  } catch {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect(
      getPassVerificationRedirectPath({
        next: nextPath,
      })
    )
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
    redirect(
      buildPathWithNext({
        path: ONBOARDING_PATH,
        next: nextPath,
      })
    )
  }

  if (userId) {
    const conversation = await getOrCreateConversation({
      userAId: user.id,
      userBId: userId,
    })

    redirect(`/messages/${conversation.id}`)
  }

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
  const visibleConversations = conversations.filter(
    (
      conversation
    ): conversation is typeof conversation & {
      participant: NonNullable<typeof conversation.participant>
    } => conversation.participant !== null
  )

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold text-white">Messages</h1>
        <p className="mt-2 text-sm text-zinc-400">
          View your conversations and continue chatting with creators and fans.
        </p>
      </Card>

      <ConversationList
        conversations={visibleConversations}
        emptyMessage="No conversations yet."
      />
    </main>
  )
}
