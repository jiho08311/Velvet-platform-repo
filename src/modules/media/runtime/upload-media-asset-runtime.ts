// src/modules/media/runtime/upload-media-asset-runtime.ts

import { uploadMediaFileToStorage } from "@/modules/media/repositories/media-storage-repository"
import {
  buildMediaStoragePathLineage,
  type MediaStoragePurpose,
} from "@/modules/media/services/media-storage-path-service"
import { resolveUploadMediaCapability } from "@/modules/media/capabilities/resolve-upload-media-capability"
import {
  createMediaAssetRuntime,
  type MediaAssetContract,
} from "@/modules/media/runtime/create-media-asset-runtime"

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

export type UploadMediaAssetRuntimeInput = {
  uploaderUserId: string
  file: File
  purpose?: MediaStoragePurpose
  sourceSurface: string
}

export type UploadMediaAssetRuntimeContract = {
  asset: MediaAssetContract
  storagePath: string
}

function resolveMediaTypeFromMimeType(
  mimeType: string
): "image" | "video" | "audio" | "file" {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  return "file"
}

function toUploadMediaAssetCapabilityError(reason: string): Error {
  if (reason === "missing_uploader_user_id") {
    return new Error("uploaderUserId is required")
  }

  if (reason === "invalid_file") {
    return new Error("file is required")
  }

  if (reason === "empty_file") {
    return new Error("file is empty")
  }

  return new Error("Upload media asset capability denied")
}

export async function uploadMediaAssetRuntime({
  uploaderUserId,
  file,
  purpose = "post",
  sourceSurface,
}: UploadMediaAssetRuntimeInput): Promise<UploadMediaAssetRuntimeContract> {
  const capability = resolveUploadMediaCapability({
    uploaderUserId,
    file,
    purpose,
  })

  if (!capability.allowed) {
    throw toUploadMediaAssetCapabilityError(capability.reason)
  }

  const pathLineage = buildMediaStoragePathLineage({
    uploaderUserId: capability.uploaderUserId,
    file: capability.file,
    purpose: capability.purpose,
  })

  await uploadMediaFileToStorage({
    storagePath: pathLineage.storagePath,
    file: capability.file,
  })

  const asset = await createMediaAssetRuntime({
    ownerUserId: capability.uploaderUserId,
    mediaType: resolveMediaTypeFromMimeType(capability.file.type || ""),
    mimeType: capability.file.type || null,
    originalFilename: capability.file.name || null,
    fileSizeBytes: capability.file.size,
    storageBucket: MEDIA_BUCKET,
    storagePath: pathLineage.storagePath,
    processingStatus: "ready",
    sourceSurface,
  })

  return {
    asset,
    storagePath: pathLineage.storagePath,
  }
}