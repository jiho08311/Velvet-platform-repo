// src/modules/media/public/upload-feed-composer-media.ts
"use server"

import { uploadFeedComposerMediaUseCase } from "@/modules/media/use-cases/upload-feed-composer-media"
import type { CreatePostUploadedMediaInput } from "@/modules/post/types"

type UploadFeedComposerMediaInput = {
  uploaderUserId: string
  files: File[]
}

export async function uploadFeedComposerMedia({
  uploaderUserId,
  files,
}: UploadFeedComposerMediaInput): Promise<CreatePostUploadedMediaInput[]> {
  return uploadFeedComposerMediaUseCase({ uploaderUserId, files })
}