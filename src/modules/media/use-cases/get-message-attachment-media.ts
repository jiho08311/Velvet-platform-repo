import {
  getMessageAttachmentEligibilityRowsByIds as getMessageAttachmentEligibilityRowsByIdsUseCase,
} from "@/modules/media/use-cases/get-message-media"

export async function getMessageAttachmentEligibilityRowsByIds(
  mediaIds: string[]
) {
  return getMessageAttachmentEligibilityRowsByIdsUseCase(mediaIds)
}
