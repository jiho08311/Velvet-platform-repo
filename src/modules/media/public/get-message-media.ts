"use server"
// PUBLIC_CONTRACT

import {
  attachMessageMediaRowsToMessage as attachMessageMediaRowsToMessageUseCase,
  getMessageAttachmentEligibilityRowsByIds as getMessageAttachmentEligibilityRowsByIdsUseCase,
  getMessageMediaRowsByMessageId as getMessageMediaRowsByMessageIdUseCase,
  getMessageMediaRowsByMessageIdOrEmpty as getMessageMediaRowsByMessageIdOrEmptyUseCase,
  getMessageMediaRowsByMessageIds as getMessageMediaRowsByMessageIdsUseCase,
  getModerationMediaRowsByIds as getModerationMediaRowsByIdsUseCase,
} from "@/modules/media/use-cases/get-message-media"

export async function getMessageMediaRowsByMessageIds(messageIds: string[]) {
  return getMessageMediaRowsByMessageIdsUseCase(messageIds)
}

export async function getMessageMediaRowsByMessageIdOrEmpty(
  messageId: string
) {
  return getMessageMediaRowsByMessageIdOrEmptyUseCase(messageId)
}

export async function getMessageMediaRowsByMessageId(messageId: string) {
  return getMessageMediaRowsByMessageIdUseCase(messageId)
}

export async function getMessageAttachmentEligibilityRowsByIds(
  mediaIds: string[]
) {
  return getMessageAttachmentEligibilityRowsByIdsUseCase(mediaIds)
}

export async function getModerationMediaRowsByIds(mediaIds: string[]) {
  return getModerationMediaRowsByIdsUseCase(mediaIds)
}

export async function attachMessageMediaRowsToMessage(input: {
  mediaIds: string[]
  messageId: string
}) {
  return attachMessageMediaRowsToMessageUseCase(input)
}
