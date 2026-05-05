import { uploadMediaUseCase } from "@/modules/media/use-cases/upload-media"

type UploadMediaInput = {
  uploaderUserId: string
  file: File
  purpose?: any
}

export async function uploadMedia(input: UploadMediaInput): Promise<string> {
  return uploadMediaUseCase(input)
}