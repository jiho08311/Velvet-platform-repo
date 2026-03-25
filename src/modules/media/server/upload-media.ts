import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type UploadMediaInput = {
  creatorId: string
  file: File
}

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

function getFileExtension(fileName: string): string {
  const segments = fileName.split(".")
  return segments.length > 1 ? segments[segments.length - 1].toLowerCase() : ""
}

function buildStoragePath(creatorId: string, file: File): string {
  const now = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  const extension = getFileExtension(file.name)
  const safeExtension = extension ? `.${extension}` : ""

  return `creator/${creatorId}/posts/${now}-${random}${safeExtension}`
}

export async function uploadMedia({
  creatorId,
  file,
}: UploadMediaInput): Promise<string> {
  const resolvedCreatorId = creatorId.trim()

  if (!resolvedCreatorId) {
    throw new Error("creatorId is required")
  }

  if (!(file instanceof File)) {
    throw new Error("file is required")
  }

  if (file.size <= 0) {
    throw new Error("file is empty")
  }

  const storagePath = buildStoragePath(resolvedCreatorId, file)

  const { error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    })

  if (error) {
    throw error
  }

  return storagePath
}