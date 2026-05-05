"use server"

import { downloadMediaStorageFileUseCase } from "@/modules/media/use-cases/download-media-storage-file"

type DownloadMediaStorageFileInput = {
  storagePath: string
  missingDataErrorMessage?: string
}

export async function downloadMediaStorageFile(
  input: DownloadMediaStorageFileInput
) {
  return downloadMediaStorageFileUseCase(input)
}
