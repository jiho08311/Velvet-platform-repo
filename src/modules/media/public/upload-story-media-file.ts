"use server"
// PUBLIC_CONTRACT

import { requireUser } from "@/modules/auth/public/require-user"
import { uploadMedia } from "@/modules/media/runtime/upload-media"

type UploadStoryMediaFileInput = {
  file: File
}

export async function uploadStoryMediaFile({
  file,
}: UploadStoryMediaFileInput): Promise<string> {
  const user = await requireUser()

  return uploadMedia({
    uploaderUserId: user.id,
    file,
    purpose: "story",
  })
}
