import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { assertValidMessagePrice } from "@/modules/message/lib/message-price"

type SendMessageInput = {
  conversationId: string
  senderId: string
  content: string
  type?: "text" | "ppv"
  price?: number | null
  mediaIds?: string[]
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

type ProfileRow = {
  id: string
  is_deactivated: boolean | null
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

type MediaRow = {
  id: string
  owner_user_id: string | null
  post_id: string | null
  message_id: string | null
}

export async function sendMessage(input: SendMessageInput) {
  const supabase = await createSupabaseServerClient()

  const trimmedContent = input.content.trim()
  const messageType = input.type ?? "text"
  const messagePrice = messageType === "ppv" ? input.price ?? null : null
  const mediaIds = Array.from(new Set((input.mediaIds ?? []).filter(Boolean)))
  const hasMedia = mediaIds.length > 0

  // 🔥 핵심 로그 1
  console.log("[sendMessage] incoming mediaIds:", mediaIds)

  if (!trimmedContent && !hasMedia) {
    throw new Error("Message content or media is required")
  }

  if (messageType !== "text" && messageType !== "ppv") {
    throw new Error("Invalid message type")
  }

  let finalPrice: number | null = null

  if (messageType === "ppv") {
    try {
      finalPrice = assertValidMessagePrice(messagePrice ?? 0)
    } catch {
      throw new Error("Invalid message price")
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

  const participantUserIds = participantRows.map((row) => row.user_id)

  const otherUserId =
    participantUserIds.find((userId) => userId !== input.senderId) ?? null

  const { data: senderCreator } = await supabase
    .from("creators")
    .select("id, user_id")
    .eq("user_id", input.senderId)
    .maybeSingle<CreatorRow>()

  const { data: otherCreator } = await supabase
    .from("creators")
    .select("id, user_id")
    .eq("user_id", otherUserId)
    .maybeSingle<CreatorRow>()

  const senderIsCreator = Boolean(senderCreator)
  const otherIsCreator = Boolean(otherCreator)

  if (!senderIsCreator && otherIsCreator && otherCreator) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("creator_id", otherCreator.id)
      .eq("user_id", input.senderId)
      .maybeSingle<SubscriptionRow>()

    if (!subscription || subscription.status !== "active") {
      throw new Error("Subscription required")
    }
  }

  if (messageType === "ppv" && !senderIsCreator) {
    throw new Error("Only creators can send PPV messages")
  }

  // 🔥 핵심 로그 2 (media 존재 여부 확인)
  if (mediaIds.length > 0) {
    const { data: existingMedia, error: mediaFetchError } = await supabaseAdmin
      .from("media")
      .select("id, owner_user_id, post_id, message_id")
      .in("id", mediaIds)

    console.log("[sendMessage] fetched media rows:", existingMedia)

    if (mediaFetchError) {
      console.error("[sendMessage] media fetch error:", mediaFetchError)
      throw mediaFetchError
    }

    const mediaRows = (existingMedia ?? []) as MediaRow[]

    if (mediaRows.length !== mediaIds.length) {
      console.error("[sendMessage] media length mismatch", {
        mediaIds,
        mediaRows,
      })
      throw new Error("Some media files were not found")
    }
  }

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      content: trimmedContent,
      type: messageType,
      price: finalPrice,
    })
    .select("id, created_at")
    .single<MessageRow>()

  if (messageError) {
    console.error("[sendMessage] message insert error:", messageError)
    throw messageError
  }

  // 🔥 핵심 로그 3 (message 생성 확인)
  console.log("[sendMessage] created message:", message.id)

  if (mediaIds.length > 0) {
    const { data: updatedMedia, error: mediaUpdateError } = await supabaseAdmin
      .from("media")
      .update({
        message_id: message.id,
      })
      .in("id", mediaIds)
      .select("id, message_id")

    // 🔥 핵심 로그 4 (업데이트 결과)
    console.log("[sendMessage] updatedMedia:", updatedMedia)
    console.log("[sendMessage] mediaUpdateError:", mediaUpdateError)

    if (mediaUpdateError) {
      throw mediaUpdateError
    }

    if (!updatedMedia || updatedMedia.length !== mediaIds.length) {
      console.error("[sendMessage] media attach failed", {
        mediaIds,
        updatedMedia,
      })
      throw new Error("Failed to attach media to message")
    }
  }

  await supabase
    .from("conversations")
    .update({
      updated_at: new Date().toISOString(),
      last_message_at: message.created_at,
    })
    .eq("id", input.conversationId)

  return {
    id: message.id,
    conversationId: input.conversationId,
  }
}