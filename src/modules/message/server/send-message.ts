import OpenAI from "openai"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  createConversationMessageMediaMap,
  type MessageMediaRow,
} from "@/modules/message/server/create-conversation-message-media"

import { assertMessageAttachmentEligibility } from "@/modules/message/server/assert-message-attachment-eligibility"
import {
  createSendMessageOutput,
  createMessageSentEvent,
  normalizeConversationMessageItem,
  type SendMessagePayload,
} from "@/modules/message/types"
import { createMessageReceivedNotification } from "@/modules/notification/server/create-message-received-notification"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

type SendMessageInput = SendMessagePayload & {
  senderId: string
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  created_at: string
  read_at: string | null
  status: string | null
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
    .select(
      "id, conversation_id, sender_id, content, created_at, read_at, status, type, price"
    )
    .single<MessageRow>()

  if (messageError) {
    throw messageError
  }

  const messageSentEvent = createMessageSentEvent({
    messageId: message.id,
    conversationId: input.conversationId,
    senderId: input.senderId,
    recipientUserId: otherUserId,
  })

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

  const { data: mediaRowsData, error: mediaRowsError } = await supabaseAdmin
    .from("media")
    .select("id, message_id, storage_path, mime_type")
    .eq("message_id", message.id)
    .order("created_at", { ascending: true })

  if (mediaRowsError) {
    throw mediaRowsError
  }

  const mediaRows = (mediaRowsData ?? []) as MessageMediaRow[]
  const mediaMap = await createConversationMessageMediaMap({
    mediaRows,
    viewerUserId: input.senderId,
    senderUserIdByMessageId: new Map([[message.id, message.sender_id]]),
  })

  const output = createSendMessageOutput({
    message: normalizeConversationMessageItem(
      message,
      mediaMap.get(message.id) ?? []
    ),
    messageSentEvent,
  })

  await createMessageReceivedNotification(output.messageSentEvent)

  return output.message
}
