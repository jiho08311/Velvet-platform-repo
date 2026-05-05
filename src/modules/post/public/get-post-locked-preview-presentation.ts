import {
  getPostLockedPreviewPresentation as getPostLockedPreviewPresentationInternal,
  type PostLockedPreviewPresentation,
} from "@/modules/post/lib/get-post-locked-preview-presentation"

export type { PostLockedPreviewPresentation }

export function getPostLockedPreviewPresentation(
  access: Parameters<typeof getPostLockedPreviewPresentationInternal>[0]
): ReturnType<typeof getPostLockedPreviewPresentationInternal> {
  return getPostLockedPreviewPresentationInternal(access)
}
