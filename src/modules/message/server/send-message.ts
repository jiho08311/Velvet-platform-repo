import OpenAI from "openai"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import {
  createConversationMessageMediaMap,
  type MessageMediaRow,
} from "@/modules/message/server/create-conversation-message-media"
import {
  attachMessageMediaRowsToMessage,
  getMessageMediaRowsByMessageId,
  getModerationMediaRowsByIds,
} from "@/modules/media/public/get-message-media"
import { downloadMediaStorageFile } from "@/modules/media/public/download-media-storage-file"
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

  const mediaRows = await getModerationMediaRowsByIds(mediaIds)

  for (const media of mediaRows) {
    if (!media.mime_type?.startsWith("image/")) continue

    const arrayBuffer = await downloadMediaStorageFile({
      storagePath: media.storage_path,
      missingDataErrorMessage: "Failed to load image for moderation",
    })
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
    const updatedMediaList = await attachMessageMediaRowsToMessage({
      mediaIds: validatedMediaIds,
      messageId: message.id,
    })

    if (updatedMediaList.length !== validatedMediaIds.length) {
      throw new Error("Failed to attach media to message")
    }
  }

  await supabase
    .from("conversations")
    .update({
      updated_at: new Date().toISOString(),

      // Conversation list ordering source of truth.
      // Keep this tied to the persisted message timestamp, not a new client/server now.
      last_message_at: message.created_at,
    })
    .eq("id", input.conversationId)

  const mediaRows = (await getMessageMediaRowsByMessageId(
    message.id
  )) as MessageMediaRow[]

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
