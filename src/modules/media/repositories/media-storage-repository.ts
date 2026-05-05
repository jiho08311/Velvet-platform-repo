import { supabaseAdmin } from "@/infrastructure/supabase/admin"

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

type UploadMediaFileToStorageInput = {
  storagePath: string
  file: File
}

export async function uploadMediaFileToStorage({
  storagePath,
  file,
}: UploadMediaFileToStorageInput): Promise<void> {
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
}


// 추가

type DownloadMediaStorageFileInput = {
  storagePath: string
  missingDataErrorMessage?: string
}

export async function downloadMediaStorageFile({
  storagePath,
  missingDataErrorMessage = "Failed to download video from storage",
}: DownloadMediaStorageFileInput): Promise<ArrayBuffer> {
  const { data, error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .download(storagePath)

  if (error || !data) {
    throw error ?? new Error(missingDataErrorMessage)
  }

  return await data.arrayBuffer()
}

type CreateMediaStorageSignedUrlInput = {
  storagePath: string
  expiresIn: number
}

export async function createMediaStorageSignedUrl({
  storagePath,
  expiresIn,
}: CreateMediaStorageSignedUrlInput): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(storagePath, expiresIn)

  if (error) {
    return ""
  }

  return data?.signedUrl ?? ""
}
