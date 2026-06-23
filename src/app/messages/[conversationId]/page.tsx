import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { readOnboardingReadinessRuntime } from "@/modules/identity/public/onboarding-readiness"
import { requireSession } from "@/modules/auth/public/require-session"
import {
  assertPassVerified,
  getPassVerificationRedirectPath,
} from "@/modules/auth/public/assert-pass-verified"
import {
  buildPathWithNext,
  ONBOARDING_PATH,
  SIGN_IN_PATH,
} from "@/modules/auth/utils/redirect-handoff"
import { getConversationById } from "@/modules/message/public/get-conversation-by-id"
import { listMessages } from "@/modules/message/public/list-messages"
import { markConversationRead } from "@/modules/message/public/mark-conversation-read"
import { MessageThreadSection } from "@/modules/message/public/message-ui"
import { toConversationMessageListItem } from "@/modules/message/types"


type ConversationDetailPageProps = {
  params: Promise<{
    conversationId: string
  }>
}



export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const { conversationId } = await params
  const pathname = `/messages/${conversationId}`
let session: Awaited<ReturnType<typeof requireSession>>

  try {
 session = await requireSession()
  } catch {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: pathname,
      })
    )
  }

  try {
    await assertPassVerified({ profileId: session.userId })
  } catch {
    redirect(getPassVerificationRedirectPath({ next: pathname }))
  }


const onboarding = await readOnboardingReadinessRuntime({
  userId: session.userId,
})

if (!onboarding.ok) {
  redirect(
    buildPathWithNext({
      path: ONBOARDING_PATH,
      next: pathname,
    })
  )
}



  const conversation = await getConversationById({
    conversationId,
    userId: session.userId,
  })

  if (!conversation) {
    notFound()
  }

   const messages = await listMessages({
    conversationId,
    userId: session.userId,
  })

  /**
   * Detail thread source of truth.
   *
   * ConversationSummary.lastMessage is not used for detail rendering.
   * Thread UI must be built from listMessages().
   */
  const messageListItems = messages.map((message) =>
    toConversationMessageListItem({
      message,
      currentUserId: session.userId,
      reportPathname: pathname,
    })
  )
/**
   * Load-side read boundary.
   *
   * This call intentionally preserves the current persistence behavior of
   * markConversationRead(). At the moment, read persistence SoT is not defined
   * here, and this page must not introduce unread badge/count behavior.
   *
   * Thread rendering remains sourced from listMessages() above.
   */
  await markConversationRead({
    conversationId,
    userId: session.userId,
  })

  const participant = conversation.participant
  const participantDisplayName = participant?.displayName ?? "Unknown user"
  const participantUsername = participant?.username ?? "unknown"
  const participantAvatarUrl = participant?.avatarUrl ?? null

  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col gap-4 px-4 py-6">
      <section className="flex items-center gap-4 rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white">
        <Link
          href="/messages"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-white/80 transition hover:bg-white/5"
        >
          뒤로가기
        </Link>

        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/80">
          {participantAvatarUrl ? (
            <img
              src={participantAvatarUrl}
              alt={participantDisplayName}
              className="h-full w-full object-cover"
            />
          ) : (
            participantDisplayName.slice(0, 1).toUpperCase()
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {participantDisplayName}
          </p>
          <p className="truncate text-xs text-white/50">
            @{participantUsername}
          </p>
        </div>
      </section>

      <section className="flex flex-1 flex-col rounded-2xl border border-white/10 bg-neutral-950 p-4">
        <MessageThreadSection
          conversationId={conversation.id}
          currentUserId={session.userId}
          reportPathname={pathname}
          initialMessages={messageListItems}
        />
      </section>
    </main>
  )
}
