import { assertMessageAttachmentEligibility } from "@/modules/message/runtime/policies/assert-message-attachment-eligibility"
import {
  createMessageSentEvent,
  createSendMessageOutput,
  type SendMessagePayload,
} from "@/modules/message/types"
import { insertMessageSentOutboxEvent } from "@/modules/message/repositories/message-outbox-repository"
import { assertMessageSafety } from "@/modules/message/runtime/message-safety-runtime"
import {
  executeMessageWriteRuntime,
} from "@/modules/message/runtime/message-write-runtime"

import { normalizeConversationMessageItem } from "@/modules/message/types"

export type SendMessageRuntimeInput = SendMessagePayload & {
  senderId: string
}

function buildSendMessageCommand(input: SendMessageRuntimeInput) {
  const content = input.content.trim()
  const mediaIds = Array.from(new Set((input.mediaIds ?? []).filter(Boolean)))
  const hasMedia = mediaIds.length > 0

  if (!content && !hasMedia) {
    throw new Error("Message content or media is required")
  }

  return {
    conversationId: input.conversationId,
    senderId: input.senderId,
    content,
    mediaIds,
  }
}

export async function runSendMessageRuntime(input: SendMessageRuntimeInput) {
  const command = buildSendMessageCommand(input)

  await assertMessageSafety({
    content: command.content,
    mediaIds: command.mediaIds,
  })

  const { otherUserId, mediaIds: validatedMediaIds } =
    await assertMessageAttachmentEligibility({
      conversationId: command.conversationId,
      senderId: command.senderId,
      mediaIds: command.mediaIds,
    })

  const message = await executeMessageWriteRuntime({
    conversationId: command.conversationId,
    senderId: command.senderId,
    content: command.content,
    mediaIds: validatedMediaIds,
  })

  const messageSentEvent = createMessageSentEvent({
    messageId: message.id,
    conversationId: command.conversationId,
    senderId: command.senderId,
    recipientUserId: otherUserId,
  })



const responseMessage = normalizeConversationMessageItem(message, [])

  const output = createSendMessageOutput({
    message: responseMessage,
    messageSentEvent,
  })



  
await insertMessageSentOutboxEvent(output.messageSentEvent)

  return output
}
