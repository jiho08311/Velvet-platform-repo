"use server"

import { requireUser } from "@/modules/auth/server/require-user"
import { uploadMedia } from "@/modules/media/server/upload-media"
import type { CreatePostUploadedMediaInput } from "@/modules/post/types"

type UploadPostMediaInput = {
  files: {
    placeholderId: string
    file: File
  }[]
}

function resolveUploadedMediaType(
  mimeType: string
): CreatePostUploadedMediaInput["type"] {
  if (mimeType.startsWith("image/")) {
    return "image"
  }

  if (mimeType.startsWith("video/")) {
    return "video"
  }

  if (mimeType.startsWith("audio/")) {
    return "audio"
  }

  return "file"
}

export async function uploadPostMedia({
  files,
}: UploadPostMediaInput): Promise<
  Record<string, CreatePostUploadedMediaInput>
> {
  if (files.length === 0) {
    return {}
  }

  const user = await requireUser()
  const uploaded: Record<string, CreatePostUploadedMediaInput> = {}

  for (const entry of files) {
    const path = await uploadMedia({
      uploaderUserId: user.id,
      file: entry.file,
      purpose: "post",
    })

    uploaded[entry.placeholderId] = {
      path,
      type: resolveUploadedMediaType(entry.file.type || ""),
      mimeType: entry.file.type || "",
      size: entry.file.size,
      originalName: entry.file.name,
    }
  }

  return uploaded
}