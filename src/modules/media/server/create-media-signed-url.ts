import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreateMediaSignedUrlInput = {
  storagePath: string
  expiresIn?: number
}

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

export async function createMediaSignedUrl({
  storagePath,
  expiresIn = 60 * 60,
}: CreateMediaSignedUrlInput): Promise<string> {
  const resolvedStoragePath = storagePath.trim()

  if (!resolvedStoragePath) {
    throw new Error("storagePath is required")
  }

  const { data, error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(resolvedStoragePath, expiresIn)

  if (error) {
    throw error
  }

  if (!data?.signedUrl) {
    throw new Error("Failed to create media signed url")
  }

  return data.signedUrl
}