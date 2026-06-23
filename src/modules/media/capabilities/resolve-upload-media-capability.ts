import type { MediaStoragePurpose } from "@/modules/media/services/media-storage-path-service"

export type ResolveUploadMediaCapabilityInput = {
  uploaderUserId: string
  file: File
  purpose?: MediaStoragePurpose
}

export type UploadMediaCapabilityDeniedReason =
  | "missing_uploader_user_id"
  | "invalid_file"
  | "empty_file"

export type UploadMediaCapability =
  | {
      allowed: true
      uploaderUserId: string
      file: File
      purpose: MediaStoragePurpose
      reason: "upload_allowed"
      lineage: {
        uploaderUserId: string
        purpose: MediaStoragePurpose
      }
    }
  | {
      allowed: false
      reason: UploadMediaCapabilityDeniedReason
      lineage: {
        uploaderUserId: string | null
        purpose: MediaStoragePurpose
      }
    }

export function resolveUploadMediaCapability({
  uploaderUserId,
  file,
  purpose = "post",
}: ResolveUploadMediaCapabilityInput): UploadMediaCapability {
  const resolvedUploaderUserId = uploaderUserId.trim()

  if (!resolvedUploaderUserId) {
    return {
      allowed: false,
      reason: "missing_uploader_user_id",
      lineage: {
        uploaderUserId: null,
        purpose,
      },
    }
  }

  if (!(file instanceof File)) {
    return {
      allowed: false,
      reason: "invalid_file",
      lineage: {
        uploaderUserId: resolvedUploaderUserId,
        purpose,
      },
    }
  }

  if (file.size <= 0) {
    return {
      allowed: false,
      reason: "empty_file",
      lineage: {
        uploaderUserId: resolvedUploaderUserId,
        purpose,
      },
    }
  }

  return {
    allowed: true,
    uploaderUserId: resolvedUploaderUserId,
    file,
    purpose,
    reason: "upload_allowed",
    lineage: {
      uploaderUserId: resolvedUploaderUserId,
      purpose,
    },
  }
}