import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreateMediaSignedUrlInput = {
  storagePath: string
  expiresIn?: number
}

export async function createMediaSignedUrl({
  storagePath,
  expiresIn = 60 * 10,
}: CreateMediaSignedUrlInput): Promise<string> {
  const path = storagePath.trim()

  if (!path) {
    throw new Error("storagePath is required")
  }

  const { data, error } = await supabaseAdmin.storage
    .from("post-media")
    .createSignedUrl(path, expiresIn)

  if (error) {
    throw error
  }

  return data.signedUrl
}