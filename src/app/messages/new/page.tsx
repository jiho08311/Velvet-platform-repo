import { redirect } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUsername } from "@/modules/creator/server/get-creator-by-username"
import { getOrCreateConversation } from "@/modules/message/server/get-or-create-conversation"

type NewMessagePageProps = {
  searchParams: Promise<{
    creatorUsername?: string
  }>
}

export default async function NewMessagePage({
  searchParams,
}: NewMessagePageProps) {
  const user = await requireUser()
  const { creatorUsername } = await searchParams

  if (!creatorUsername) {
    redirect("/messages")
  }

  const creator = await getCreatorByUsername(creatorUsername)

  if (!creator) {
    redirect("/messages")
  }

  if (creator.userId === user.id) {
    redirect("/messages")
  }

  try {
    const conversation = await getOrCreateConversation({
      userAId: user.id,
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