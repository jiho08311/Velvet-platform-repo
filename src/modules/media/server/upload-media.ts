import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type UploadMediaInput = {
  uploaderUserId: string
  file: File
  purpose?: "post" | "message"
}

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

function getFileExtension(fileName: string): string {
  const segments = fileName.split(".")
  return segments.length > 1 ? segments[segments.length - 1].toLowerCase() : ""
}

function buildStoragePath(
  uploaderUserId: string,
  file: File,
  purpose: "post" | "message"
): string {
  const now = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  const extension = getFileExtension(file.name)
  const safeExtension = extension ? `.${extension}` : ""

  if (purpose === "message") {
    return `user/${uploaderUserId}/messages/${now}-${random}${safeExtension}`
  }

  return `creator/${uploaderUserId}/posts/${now}-${random}${safeExtension}`
}

export async function uploadMedia({
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

  const storagePath = buildStoragePath(resolvedUploaderUserId, file, purpose)

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