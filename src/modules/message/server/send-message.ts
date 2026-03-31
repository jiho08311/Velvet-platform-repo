import OpenAI from "openai"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { assertValidMessagePrice } from "@/modules/message/lib/message-price"
import { getActiveSubscription } from "@/modules/subscription/server/get-active-subscription"
import { checkTextSafety } from "@/workflows/create-post-with-media-workflow"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

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

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  type: string | null
  price: number | null
}

type ExistingMediaRow = {
  id: string
  owner_user_id: string | null
  post_id: string | null
  message_id: string | null
}

type ModerationMediaRow = {
  id: string
  storage_path: string
  mime_type: string | null
}

async function checkMessageImageSafety(mediaIds: string[]) {
  if (mediaIds.length === 0) return

  const { data: mediaRows, error: mediaRowsError } = await supabaseAdmin
    .from("media")
    .select("id, storage_path, mime_type")
    .in("id", mediaIds)

  if (mediaRowsError) {
    throw mediaRowsError
  }

  console.log("[checkMessageImageSafety] mediaRows:", mediaRows)

  for (const media of (mediaRows ?? []) as ModerationMediaRow[]) {
    if (!media.mime_type?.startsWith("image/")) continue

    console.log(
      "[checkMessageImageSafety] moderating:",
      media.id,
      media.mime_type
    )

    const { data, error: downloadError } = await supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .download(media.storage_path)

    if (downloadError) {
      console.error("[checkMessageImageSafety] download error:", downloadError)
      throw downloadError
    }

    if (!data) {
      throw new Error("Failed to load image for moderation")
    }

    const arrayBuffer = await data.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const dataUrl = `data:${media.mime_type};base64,${base64}`

    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        {
          type: "image_url",
          image_url: {
            url: dataUrl,
          },
        },
      ],
    })

    const result = response.results?.[0]

    console.log("[checkMessageImageSafety] moderation result:", result)

    if (!result) {
      throw new Error("Failed to moderate image")
    }

    if (result.flagged) {
      throw new Error("IMAGE_BLOCKED")
    }
  }
}

export async function sendMessage(input: SendMessageInput) {
  const supabase = await createSupabaseServerClient()

  const trimmedContent = input.content.trim()
  const messageType = input.type ?? "text"
  const messagePrice = messageType === "ppv" ? input.price ?? null : null
  const mediaIds = Array.from(new Set((input.mediaIds ?? []).filter(Boolean)))
  const hasMedia = mediaIds.length > 0

  console.log("[sendMessage] incoming mediaIds:", mediaIds)

  if (!trimmedContent && !hasMedia) {
    throw new Error("Message content or media is required")
  }

  console.log("[sendMessage] before text moderation")
  await checkTextSafety(trimmedContent)
  console.log("[sendMessage] text moderation passed")

  console.log("[sendMessage] before image moderation")
  await checkMessageImageSafety(mediaIds)
  console.log("[sendMessage] image moderation passed")

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
    const subscription = await getActiveSubscription({
      userId: input.senderId,
      creatorId: otherCreator.id,
    })

    if (!subscription) {
      throw new Error("Subscription required")
    }
  }

  if (messageType === "ppv" && !senderIsCreator) {
    throw new Error("Only creators can send PPV messages")
  }

  if (mediaIds.length > 0) {
    const { data: existingMedia, error: mediaFetchError } = await supabaseAdmin
      .from("media")
      .select("id, owner_user_id, post_id, message_id")
      .in("id", mediaIds)

    if (mediaFetchError) {
      throw mediaFetchError
    }

    if (((existingMedia ?? []) as ExistingMediaRow[]).length !== mediaIds.length) {
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
    throw messageError
  }

  if (mediaIds.length > 0) {
    const { data: updatedMedia, error: mediaUpdateError } = await supabaseAdmin
      .from("media")
      .update({
        message_id: message.id,
      })
      .in("id", mediaIds)
      .select("id, message_id")

    if (mediaUpdateError) {
      throw mediaUpdateError
    }

    const updatedMediaList = Array.isArray(updatedMedia) ? updatedMedia : []

    if (updatedMediaList.length !== mediaIds.length) {
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