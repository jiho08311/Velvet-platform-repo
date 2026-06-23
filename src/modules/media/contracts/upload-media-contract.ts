import type { MediaStoragePurpose } from "@/modules/media/services/media-storage-path-service"

export type UploadMediaContract = {
  storagePath: string
  lineage: {
    uploaderUserId: string
    purpose: MediaStoragePurpose
    storageBoundary: "media-storage"
  }
}

export function createUploadMediaContract({
  storagePath,
  uploaderUserId,
  purpose,
}: {
  storagePath: string
  uploaderUserId: string
  purpose: MediaStoragePurpose
}): UploadMediaContract {
  return {
    storagePath,
    lineage: {
      uploaderUserId,
      purpose,
      storageBoundary: "media-storage",
    },
  }
}

export function toUploadMediaResponse(contract: UploadMediaContract): string {
  return contract.storagePath
}
