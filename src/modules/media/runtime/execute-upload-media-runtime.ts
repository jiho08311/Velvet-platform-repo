import { resolveUploadMediaCapability } from "@/modules/media/capabilities/resolve-upload-media-capability"
import {
  createUploadMediaContract,
  type UploadMediaContract,
} from "@/modules/media/contracts/upload-media-contract"
import { uploadMediaFileToStorage } from "@/modules/media/repositories/media-storage-repository"
import {
  buildMediaStoragePathLineage,
  type MediaStoragePurpose,
} from "@/modules/media/services/media-storage-path-service"

export type ExecuteUploadMediaRuntimeInput = {
  uploaderUserId: string
  file: File
  purpose?: MediaStoragePurpose
}

function toUploadMediaCapabilityError(reason: string): Error {
  if (reason === "missing_uploader_user_id") {
    return new Error("uploaderUserId is required")
  }

  if (reason === "invalid_file") {
    return new Error("file is required")
  }

  if (reason === "empty_file") {
    return new Error("file is empty")
  }

  return new Error("Upload media capability denied")
}

export async function executeUploadMediaRuntime({
  uploaderUserId,
  file,
  purpose = "post",
}: ExecuteUploadMediaRuntimeInput): Promise<UploadMediaContract> {
  const capability = resolveUploadMediaCapability({
    uploaderUserId,
    file,
    purpose,
  })

  if (!capability.allowed) {
    throw toUploadMediaCapabilityError(capability.reason)
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

  return createUploadMediaContract({
    storagePath: pathLineage.storagePath,
    uploaderUserId: capability.uploaderUserId,
    purpose: capability.purpose,
  })
}
