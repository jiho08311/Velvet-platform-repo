"use server"
// PUBLIC_CONTRACT

import {
  getMessageAttachmentEligibilityRowsByIds as getMessageAttachmentEligibilityRowsByIdsUseCase,
} from "@/modules/media/use-cases/get-message-attachment-media"

export async function getMessageAttachmentEligibilityRowsByIds(
  mediaIds: string[]
) {
  return getMessageAttachmentEligibilityRowsByIdsUseCase(mediaIds)
}
