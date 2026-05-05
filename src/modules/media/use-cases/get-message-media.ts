import {
  attachMediaRowsToMessage,
  findMessageMediaRowsByMessageIdOrEmpty,
  findMessageMediaRowsByMessageIds,
  findMessageMediaRowsByMessageId,
  findMessageAttachmentEligibilityRowsByIds,
  findModerationMediaRowsByIds,
  type AttachmentEligibilityMediaRow,
  type MessageMediaRow,
  type ModerationMediaRow,
} from "@/modules/media/repositories/message-media-repository"

export type {
  AttachmentEligibilityMediaRow,
  MessageMediaRow,
  ModerationMediaRow,
}

export async function getMessageMediaRowsByMessageIds(
  messageIds: string[]
): Promise<MessageMediaRow[]> {
  return findMessageMediaRowsByMessageIds(messageIds)
}

export async function getMessageMediaRowsByMessageIdOrEmpty(
  messageId: string
): Promise<MessageMediaRow[]> {
  return findMessageMediaRowsByMessageIdOrEmpty(messageId)
}

export async function getMessageMediaRowsByMessageId(
  messageId: string
): Promise<MessageMediaRow[]> {
  return findMessageMediaRowsByMessageId(messageId)
}

export async function getMessageAttachmentEligibilityRowsByIds(
  mediaIds: string[]
): Promise<AttachmentEligibilityMediaRow[]> {
  return findMessageAttachmentEligibilityRowsByIds(mediaIds)
}

export async function getModerationMediaRowsByIds(
  mediaIds: string[]
): Promise<ModerationMediaRow[]> {
  return findModerationMediaRowsByIds(mediaIds)
}

export async function attachMessageMediaRowsToMessage(input: {
  mediaIds: string[]
  messageId: string
}) {
  return attachMediaRowsToMessage(input)
}
