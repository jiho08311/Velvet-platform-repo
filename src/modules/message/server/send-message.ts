import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type SendMessageInput = {
  conversationId: string
  senderId: string
  content: string
  type?: "text" | "ppv"
  price?: number | null
}

type ParticipantRow = {
  conversation_id: string
  user_id: string
}

type CreatorRow = {
  id: string
  user_id: string
}

type SubscriptionRow = {
  status: string
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  type: string | null
  price: number | null
}

export async function sendMessage(input: SendMessageInput) {
  const supabase = await createSupabaseServerClient()

  const trimmedContent = input.content.trim()
  const messageType = input.type ?? "text"
  const messagePrice = messageType === "ppv" ? input.price ?? null : null

  if (!trimmedContent) {
    throw new Error("Message content is required")
  }

  if (messageType !== "text" && messageType !== "ppv") {
    throw new Error("Invalid message type")
  }

  if (messageType === "ppv") {
    if (messagePrice === null || Number.isNaN(messagePrice) || messagePrice <= 0) {
      throw new Error("Valid PPV price is required")
    }
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

  if (!senderIsCreator && otherIsCreator && otherCreator) {
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("creator_id", otherCreator.id)
      .eq("user_id", input.senderId)
      .maybeSingle<SubscriptionRow>()

    if (subscriptionError) {
      throw subscriptionError
    }

    if (!subscription || subscription.status !== "active") {
      throw new Error("Subscription required")
    }
  }

  if (messageType === "ppv" && !senderIsCreator) {
    throw new Error("Only creators can send PPV messages")
  }

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      content: trimmedContent,
      type: messageType,
      price: messagePrice,
    })
    .select("id, conversation_id, sender_id, content, created_at, type, price")
    .single<MessageRow>()

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

  return {
    id: message.id,
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    content: message.content,
    createdAt: message.created_at,
    type: (message.type as "text" | "ppv") ?? "text",
    price: message.price,
    isLocked: ((message.type as "text" | "ppv") ?? "text") === "ppv",
  }
}