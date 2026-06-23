import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"
import { canUseCanonicalStorageAuthorization } from "./storage-authorization-repository"

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

type StorageAction = "upload" | "download" | "create_signed_url"

async function observeCanonicalStorageAuthorizationGuard(
  storageAction: StorageAction
): Promise<boolean> {
  const canonicalAuthorized = await canUseCanonicalStorageAuthorization({
    bucketName: MEDIA_BUCKET,
    storageAction,
  })

  if (!canonicalAuthorized) {
    logger.warn({
      event: "media.storage_canonical_authorization_fallback_to_runtime",
      context: {
        bucketName: MEDIA_BUCKET,
        storageAction,
      },
    })
  }

  return canonicalAuthorized
}

type UploadMediaFileToStorageInput = {
  storagePath: string
  file: File
}

export async function uploadMediaFileToStorage({
  storagePath,
  file,
}: UploadMediaFileToStorageInput): Promise<void> {
  void observeCanonicalStorageAuthorizationGuard("upload")

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

type DownloadMediaStorageFileInput = {
  storagePath: string
  missingDataErrorMessage?: string
}

export async function downloadMediaStorageFile({
  storagePath,
  missingDataErrorMessage = "Failed to download video from storage",
}: DownloadMediaStorageFileInput): Promise<ArrayBuffer> {
  void observeCanonicalStorageAuthorizationGuard("download")

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
  void observeCanonicalStorageAuthorizationGuard("create_signed_url")

  const { data, error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(storagePath, expiresIn)

  if (error) {
    return ""
  }

  return data?.signedUrl ?? ""
}
