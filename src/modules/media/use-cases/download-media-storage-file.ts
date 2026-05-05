import { downloadMediaStorageFile } from "@/modules/media/repositories/media-storage-repository"

type DownloadMediaStorageFileInput = {
  storagePath: string
  missingDataErrorMessage?: string
}

export async function downloadMediaStorageFileUseCase(
  input: DownloadMediaStorageFileInput
): Promise<ArrayBuffer> {
  return downloadMediaStorageFile(input)
}
