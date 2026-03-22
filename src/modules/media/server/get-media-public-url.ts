import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type GetMediaPublicUrlInput = {
  storagePath: string
}

export function getMediaPublicUrl({
  storagePath,
}: GetMediaPublicUrlInput): string {
  const path = storagePath.trim()

  if (!path) {
    throw new Error("storagePath is required")
  }

  const { data } = supabaseAdmin.storage
    .from("post-media")
    .getPublicUrl(path)

  return data.publicUrl
}