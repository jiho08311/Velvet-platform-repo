import OpenAI from "openai"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

import { createNotification } from "@/modules/notification/server/create-notification"
import { assertMessageAttachmentEligibility } from "@/modules/message/server/assert-message-attachment-eligibility"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

type SendMessageInput = {
  conversationId: string
  senderId: string
  content: string
  type?: "text"
  price?: null
  mediaIds?: string[]
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

type ModerationMediaRow = {
  id: string
  storage_path: string
  mime_type: string | null
}

async function checkTextSafety(text: string) {
  const trimmed = text.trim()

  if (!trimmed) return

  const response = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: trimmed,
  })

  const result = response.results?.[0]

  if (!result) {
    throw new Error("Failed to moderate text")
  }

  if (result.flagged) {
    throw new Error("TEXT_BLOCKED")
  }
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

  for (const media of (mediaRows ?? []) as ModerationMediaRow[]) {
    if (!media.mime_type?.startsWith("image/")) continue

    const { data, error: downloadError } = await supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .download(media.storage_path)

    if (downloadError) {
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
  const mediaIds = Array.from(new Set((input.mediaIds ?? []).filter(Boolean)))
  const hasMedia = mediaIds.length > 0

  if (!trimmedContent && !hasMedia) {
    throw new Error("Message content or media is required")
  }

  await checkTextSafety(trimmedContent)
  await checkMessageImageSafety(mediaIds)

  const { otherUserId, mediaIds: validatedMediaIds } =
    await assertMessageAttachmentEligibility({
      conversationId: input.conversationId,
      senderId: input.senderId,
      mediaIds,
    })

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      content: trimmedContent,
      type: "text",
      price: null,
    })
    .select("id, created_at")
    .single<MessageRow>()

  if (messageError) {
    throw messageError
  }

  if (otherUserId) {
    await createNotification({
      userId: otherUserId,
      type: "message_received",
      title: "New message",
      body: "새로운 메시지가 도착했어요",
      data: {
        conversationId: input.conversationId,
        messageId: message.id,
      },
    })
  }

  if (validatedMediaIds.length > 0) {
    const { data: updatedMedia, error: mediaUpdateError } = await supabaseAdmin
      .from("media")
      .update({
        message_id: message.id,
      })
      .in("id", validatedMediaIds)
      .select("id, message_id")

    if (mediaUpdateError) {
      throw mediaUpdateError
    }

    const updatedMediaList = Array.isArray(updatedMedia) ? updatedMedia : []

    if (updatedMediaList.length !== validatedMediaIds.length) {
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