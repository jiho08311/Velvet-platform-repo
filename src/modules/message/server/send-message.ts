// src/modules/message/server/send-message.ts

import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type SendMessageInput = {
  conversationId: string
  senderId: string
  content: string
}

type ParticipantRow = {
  conversation_id: string
  user_id: string
}

type CreatorRow = {
  id: string
  user_id: string
}

export async function sendMessage(input: SendMessageInput) {
  const supabase = await createSupabaseServerClient()

  const trimmedContent = input.content.trim()

  if (!trimmedContent) {
    throw new Error("Message content is required")
  }

  const { data: participants, error: participantsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .eq("conversation_id", input.conversationId)

  if (participantsError) {
    throw participantsError
  }

  const participantRows = (participants ?? []) as ParticipantRow[]

  if (participantRows.length < 2) {
    throw new Error("Conversation participants not found")
  }

  const participantUserIds = participantRows.map((row) => row.user_id)

  if (!participantUserIds.includes(input.senderId)) {
    throw new Error("Not allowed")
  }

  const otherUserId =
    participantUserIds.find((userId) => userId !== input.senderId) ?? null

  if (!otherUserId) {
    throw new Error("Other participant not found")
  }

  const { data: senderCreator, error: senderCreatorError } = await supabase
    .from("creators")
    .select("id, user_id")
    .eq("user_id", input.senderId)
    .maybeSingle<CreatorRow>()

  if (senderCreatorError) {
    throw senderCreatorError
  }

  const { data: otherCreator, error: otherCreatorError } = await supabase
    .from("creators")
    .select("id, user_id")
    .eq("user_id", otherUserId)
    .maybeSingle<CreatorRow>()

  if (otherCreatorError) {
    throw otherCreatorError
  }

  const senderIsCreator = Boolean(senderCreator)
  const otherIsCreator = Boolean(otherCreator)

  if (!senderIsCreator && otherCreator) {
  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("creator_id", otherCreator.id)
    .eq("user_id", input.senderId)
    .maybeSingle()

    if (subscriptionError) {
      throw subscriptionError
    }

    if (!subscription || subscription.status !== "active") {
      throw new Error("Subscription required")
    }
  }

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      content: trimmedContent,
    })
    .select("id, conversation_id, sender_id, content, created_at")
    .single()

  if (messageError) {
    throw messageError
  }

  const { error: conversationUpdateError } = await supabase
    .from("conversations")
    .update({
      updated_at: new Date().toISOString(),
      last_message_at: message.created_at,
    })
    .eq("id", input.conversationId)

  if (conversationUpdateError) {
    throw conversationUpdateError
  }

  return message
}