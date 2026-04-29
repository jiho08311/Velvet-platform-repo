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
import {
  toConversationMessageListItem,
  type ConversationParticipantIdentity,
} from "@/modules/message/types"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ConversationDetailPageProps = {
  params: Promise<{
    conversationId: string
  }>
}

type ProfileRow = {
  username: string | null
}

type MessageThreadHeaderProps = {
  participant: ConversationParticipantIdentity | null
}

const MESSAGE_THREAD_HEADER_CLASS_NAME =
  "flex items-center gap-4 rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white"

const MESSAGE_THREAD_BACK_LINK_CLASS_NAME =
  "inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-white/80 transition hover:bg-white/5"

const MESSAGE_THREAD_AVATAR_CLASS_NAME =
  "flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/80"

function MessageThreadHeader({ participant }: MessageThreadHeaderProps) {
  const participantDisplayName = participant?.displayName ?? "Unknown user"
  const participantUsername = participant?.username ?? "unknown"
  const participantAvatarUrl = participant?.avatarUrl ?? null

  return (
    <section className={MESSAGE_THREAD_HEADER_CLASS_NAME}>
      <MessageThreadBackLink />

      <MessageThreadParticipantAvatar
        displayName={participantDisplayName}
        avatarUrl={participantAvatarUrl}
      />

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {participantDisplayName}
        </p>
        <p className="truncate text-xs text-white/50">
          @{participantUsername}
        </p>
      </div>
    </section>
  )
}

function MessageThreadBackLink() {
  return (
    <Link href="/messages" className={MESSAGE_THREAD_BACK_LINK_CLASS_NAME}>
      뒤로가기
    </Link>
  )
}

function MessageThreadParticipantAvatar({
  displayName,
  avatarUrl,
}: {
  displayName: string
  avatarUrl: string | null
}) {
  return (
    <div className={MESSAGE_THREAD_AVATAR_CLASS_NAME}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="h-full w-full object-cover"
        />
      ) : (
        displayName.slice(0, 1).toUpperCase()
      )}
    </div>
  )
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

  /**
   * Detail thread source of truth.
   *
   * ConversationSummary.lastMessage is not used for detail rendering.
   * Thread UI must be built from listMessages().
   */
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

  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col gap-4 px-4 py-6">
      <MessageThreadHeader participant={conversation.participant} />

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
