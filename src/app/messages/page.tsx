import { redirect } from "next/navigation"
import { Card } from "@/shared/ui/Card"
import {
  assertPassVerified,
  getPassVerificationRedirectPath,
} from "@/modules/auth/public/assert-pass-verified"
import {
  buildPathWithNext,
  ONBOARDING_PATH,
  SIGN_IN_PATH,
} from "@/modules/auth/utils/redirect-handoff"
import {
  requireActiveSession,
  type ActiveSessionContext,
} from "@/modules/auth/public/require-active-session"
import { listConversations } from "@/modules/message/public/list-conversations"
import { ConversationList } from "@/modules/message/public/message-ui"
import { getOrCreateConversation } from "@/modules/message/public/get-or-create-conversation"
import { getCreatorByUserId } from "@/modules/creator/public/get-creator-by-user-id"
import { readOnboardingReadinessRuntime } from "@/modules/identity/public/onboarding-readiness"

type MessagesPageProps = {
  searchParams: Promise<{
    creatorId?: string
    userId?: string
  }>
}

export default async function MessagesPage({
  searchParams,
}: MessagesPageProps) {
  const {
    creatorId: legacyCreatorMessageTargetUserId,
    userId,
  } = await searchParams

  const nextSearchParams = new URLSearchParams()

  if (legacyCreatorMessageTargetUserId) {
    nextSearchParams.set("creatorId", legacyCreatorMessageTargetUserId)
  }

  if (userId) {
    nextSearchParams.set("userId", userId)
  }

  const nextQuery = nextSearchParams.toString()
  const nextPath = nextQuery ? `/messages?${nextQuery}` : "/messages"

  let session: ActiveSessionContext

  try {
    session = await requireActiveSession()
  } catch {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  try {
    await assertPassVerified({ profileId: session.userId })
  } catch {
    redirect(
      getPassVerificationRedirectPath({
        next: nextPath,
      })
    )
  }

  const onboarding = await readOnboardingReadinessRuntime({
    userId: session.userId,
  })

  if (!onboarding.ok) {
    redirect(
      buildPathWithNext({
        path: ONBOARDING_PATH,
        next: nextPath,
      })
    )
  }

  if (userId) {
    const conversation = await getOrCreateConversation({
      userAId: session.userId,
      userBId: userId,
    })

    redirect(`/messages/${conversation.id}`)
  }

  if (legacyCreatorMessageTargetUserId) {
    const creator = await getCreatorByUserId(legacyCreatorMessageTargetUserId)

    if (creator) {
      const conversation = await getOrCreateConversation({
        userAId: session.userId,
        userBId: creator.userId,
      })

      redirect(`/messages/${conversation.id}`)
    }
  }

  const conversations = await listConversations({
    userId: session.userId,
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
