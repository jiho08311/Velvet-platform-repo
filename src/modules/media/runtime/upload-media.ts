import { uploadMediaUseCase } from "@/modules/media/use-cases/upload-media"
import type { MediaStoragePurpose } from "@/modules/media/services/media-storage-path-service"

type UploadMediaInput = {
  uploaderUserId: string
  file: File
  purpose?: MediaStoragePurpose
}

export async function uploadMedia(input: UploadMediaInput): Promise<string> {
  return uploadMediaUseCase(input)
}
