import type {
  PostAccessResult,
  PostLockedPreviewVariant,
} from "../types"

export type PostLockedPreviewPresentation = {
  isLockedPreview: boolean
  previewVariant: PostLockedPreviewVariant | "none"
  lockReason: PostAccessResult["lockReason"]
}

export function getPostLockedPreviewPresentation(
  access: Pick<PostAccessResult, "canView" | "isLocked" | "lockReason">
): PostLockedPreviewPresentation {
  if (access.canView || !access.isLocked || access.lockReason === "none") {
    return {
      isLockedPreview: false,
      previewVariant: "none",
      lockReason: "none",
    }
  }

  return {
    isLockedPreview: true,
    previewVariant: access.lockReason,
    lockReason: access.lockReason,
  }
}
