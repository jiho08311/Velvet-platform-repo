"use server"
// PUBLIC_CONTRACT

import {
  downloadMessageModerationMedia as downloadMessageModerationMediaUseCase,
  getModerationMediaRowsByIds as getModerationMediaRowsByIdsUseCase,
} from "@/modules/media/use-cases/download-message-moderation-media"

type DownloadMessageModerationMediaInput = {
  storagePath: string
  missingDataErrorMessage?: string
}

export async function getModerationMediaRowsByIds(mediaIds: string[]) {
  return getModerationMediaRowsByIdsUseCase(mediaIds)
}

export async function downloadMessageModerationMedia(
  input: DownloadMessageModerationMediaInput
) {
  return downloadMessageModerationMediaUseCase(input)
}
