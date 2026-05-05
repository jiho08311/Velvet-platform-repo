"use server"

import { requireUser } from "@/modules/auth/server/require-user"
import { uploadMedia } from "@/modules/media/server/upload-media"

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
