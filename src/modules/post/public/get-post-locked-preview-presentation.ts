import {
  getPostLockedPreviewPresentation as getPostLockedPreviewPresentationInternal,
} from "@/modules/post/mappers/get-post-locked-preview-presentation"

export const PUBLIC_CONTRACT = true

export type PostLockedPreviewPresentation = ReturnType<
  typeof getPostLockedPreviewPresentationInternal
>

export function getPostLockedPreviewPresentation(
  access: Parameters<typeof getPostLockedPreviewPresentationInternal>[0]
): ReturnType<typeof getPostLockedPreviewPresentationInternal> {
  return getPostLockedPreviewPresentationInternal(access)
}
