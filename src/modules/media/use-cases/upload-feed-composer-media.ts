import { uploadMediaUseCase } from "@/modules/media/use-cases/upload-media"
import type { CreatePostUploadedMediaInput } from "@/modules/post/types"

type UploadFeedComposerMediaInput = {
  uploaderUserId: string
  files: File[]
}

function resolveUploadedMediaType(
  mimeType: string
): CreatePostUploadedMediaInput["type"] {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  return "file"
}

export async function uploadFeedComposerMediaUseCase({
  uploaderUserId,
  files,
}: UploadFeedComposerMediaInput): Promise<CreatePostUploadedMediaInput[]> {
  if (files.length === 0) return []

  const uploaded: CreatePostUploadedMediaInput[] = []

  for (const file of files) {
    const path = await uploadMediaUseCase({
      uploaderUserId,
      file,
      purpose: "feed-composer",
    })

    uploaded.push({
      path,
      type: resolveUploadedMediaType(file.type || ""),
      mimeType: file.type || "",
      size: file.size,
      originalName: file.name,
    })
  }

  return uploaded
}