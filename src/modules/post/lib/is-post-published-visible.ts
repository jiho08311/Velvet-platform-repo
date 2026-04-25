import { isPostPublicBaseVisible } from "./is-post-public-base-visible"

type PostPublishedVisibilityInput = {
  status: string | null | undefined
  visibility: string | null | undefined
  visibilityStatus: string | null | undefined
  moderationStatus: string | null | undefined
  deletedAt: string | null | undefined
}

export function isPostPublishedVisible(
  input: PostPublishedVisibilityInput
): boolean {
  if (
    !isPostPublicBaseVisible({
      visibility: input.visibility,
      moderationStatus: input.moderationStatus,
      deletedAt: input.deletedAt,
    })
  ) {
    return false
  }

  return (
    input.status === "published" && input.visibilityStatus === "published"
  )
}
