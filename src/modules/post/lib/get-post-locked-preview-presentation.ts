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
  access: Pick<PostAccessResult, "canView" | "locked" | "lockReason">
): PostLockedPreviewPresentation {
  if (access.canView || !access.locked || access.lockReason === "none") {
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
