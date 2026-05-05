import { uploadMediaFileToStorage } from "@/modules/media/repositories/media-storage-repository"
import {
  buildMediaStoragePath,
  type MediaStoragePurpose,
} from "@/modules/media/services/media-storage-path-service"

type UploadMediaInput = {
  uploaderUserId: string
  file: File
  purpose?: MediaStoragePurpose
}

export async function uploadMediaUseCase({
  uploaderUserId,
  file,
  purpose = "post",
}: UploadMediaInput): Promise<string> {
  const resolvedUploaderUserId = uploaderUserId.trim()

  if (!resolvedUploaderUserId) {
    throw new Error("uploaderUserId is required")
  }

  if (!(file instanceof File)) {
    throw new Error("file is required")
  }

  if (file.size <= 0) {
    throw new Error("file is empty")
  }

  const storagePath = buildMediaStoragePath(
    resolvedUploaderUserId,
    file,
    purpose
  )

  await uploadMediaFileToStorage({ storagePath, file })

  return storagePath
}