"use server"

import { uploadMediaUseCase } from "@/modules/media/use-cases/upload-media"

type UploadMediaFileInput = {
  uploaderUserId: string
  file: File
  purpose?: "post" | "message"
}

export async function uploadMediaFile(
  input: UploadMediaFileInput
): Promise<string> {
  return uploadMediaUseCase(input)
}