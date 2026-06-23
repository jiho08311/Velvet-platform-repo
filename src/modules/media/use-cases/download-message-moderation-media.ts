import { downloadMediaStorageFileUseCase } from "@/modules/media/use-cases/download-media-storage-file"
import {
  getModerationMediaRowsByIds as getModerationMediaRowsByIdsUseCase,
} from "@/modules/media/use-cases/get-message-media"

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
  return downloadMediaStorageFileUseCase(input)
}
