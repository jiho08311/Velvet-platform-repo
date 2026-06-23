import { redirect } from "next/navigation"

import { requireSession } from "@/modules/auth/public/require-session"
import { getCreatorByUsername } from "@/modules/creator/public/get-creator-by-username"
import { getOrCreateConversation } from "@/modules/message/public/get-or-create-conversation"

type NewMessagePageProps = {
  searchParams: Promise<{
    creatorUsername?: string
  }>
}

export default async function NewMessagePage({
  searchParams,
}: NewMessagePageProps) {
  const session = await requireSession()
  const { creatorUsername } = await searchParams

  if (!creatorUsername) {
    redirect("/messages")
  }

  const creator = await getCreatorByUsername(creatorUsername)

  if (!creator) {
    redirect("/messages")
  }

  if (creator.userId === session.userId) {
    redirect("/messages")
  }

  try {
    const conversation = await getOrCreateConversation({
      userAId: session.userId,
      userBId: creator.userId,
    })

    redirect(`/messages/${conversation.id}`)
  } catch (error) {
    if (error instanceof Error && error.message === "Subscription required") {
      redirect(`/creator/${creator.username}`)
    }

    throw error
  }
}