import { redirect } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type NewMessagePageProps = {
  searchParams: Promise<{
    creatorUsername?: string
  }>
}

type CreatorRow = {
  id: string
  user_id: string
  username: string
}

type ConversationRow = {
  id: string
}

type ParticipantRow = {
  conversation_id: string
  user_id: string
}

export default async function NewMessagePage({
  searchParams,
}: NewMessagePageProps) {
  const user = await requireUser()
  const { creatorUsername } = await searchParams

  if (!creatorUsername) {
    redirect("/messages")
  }

  const supabase = await createSupabaseServerClient()

  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("id, user_id, username")
    .eq("username", creatorUsername)
    .maybeSingle<CreatorRow>()

  if (creatorError || !creator) {
    redirect("/messages")
  }

  if (creator.user_id === user.id) {
    redirect("/messages")
  }

  const { data: myParticipants, error: myParticipantsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .eq("user_id", user.id)

  if (myParticipantsError) {
    throw myParticipantsError
  }

  const conversationIds = (myParticipants ?? []).map(
    (row: ParticipantRow) => row.conversation_id
  )

  if (conversationIds.length > 0) {
    const { data: creatorParticipants, error: creatorParticipantsError } =
      await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .eq("user_id", creator.user_id)
        .in("conversation_id", conversationIds)

    if (creatorParticipantsError) {
      throw creatorParticipantsError
    }

    const existingConversationId =
      (creatorParticipants ?? [])[0]?.conversation_id

    if (existingConversationId) {
      redirect(`/messages/${existingConversationId}`)
    }
  }

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .insert({})
    .select("id")
    .single<ConversationRow>()

  if (conversationError || !conversation) {
    throw conversationError ?? new Error("Failed to create conversation")
  }

  const { error: participantsError } = await supabaseAdmin
    .from("conversation_participants")
    .insert([
      {
        conversation_id: conversation.id,
        user_id: user.id,
      },
      {
        conversation_id: conversation.id,
        user_id: creator.user_id,
      },
    ])

  if (participantsError) {
    throw participantsError
  }

  redirect(`/messages/${conversation.id}`)
}