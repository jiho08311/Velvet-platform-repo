import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import {
  assertPassVerified,
  getPassVerificationRedirectPath,
} from "@/modules/auth/server/assert-pass-verified"
import {
  buildPathWithNext,
  ONBOARDING_PATH,
  SIGN_IN_PATH,
} from "@/modules/auth/lib/redirect-handoff"
import { getConversationById } from "@/modules/message/server/get-conversation-by-id"
import { listMessages } from "@/modules/message/server/list-messages"
import { markConversationRead } from "@/modules/message/server/mark-conversation-read"
import { MessageThreadSection } from "@/modules/message/ui/MessageThreadSection"
import { toConversationMessageListItem } from "@/modules/message/types"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ConversationDetailPageProps = {
  params: Promise<{
    conversationId: string
  }>
}

type ProfileRow = {
  username: string | null
}

export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const { conversationId } = await params
  const pathname = `/messages/${conversationId}`
  let user: Awaited<ReturnType<typeof requireUser>>

  try {
    user = await requireUser()
  } catch {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: pathname,
      })
    )
  }

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect(getPassVerificationRedirectPath({ next: pathname }))
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
        next: pathname,
      })
    )
  }

  const conversation = await getConversationById({
    conversationId,
    userId: user.id,
  })

  if (!conversation) {
    notFound()
  }

  const messages = await listMessages({
    conversationId,
    userId: user.id,
  })
  const messageListItems = messages.map((message) =>
    toConversationMessageListItem({
      message,
      currentUserId: user.id,
      reportPathname: pathname,
    })
  )

  await markConversationRead({
    conversationId,
    userId: user.id,
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
          currentUserId={user.id}
          reportPathname={pathname}
          initialMessages={messageListItems}
        />
      </section>
    </main>
  )
}
