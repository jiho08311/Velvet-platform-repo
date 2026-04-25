import { isPostPublicBaseVisible } from "./is-post-public-base-visible"

type PostUpcomingVisibilityInput = {
  status: string | null | undefined
  visibility: string | null | undefined
  moderationStatus: string | null | undefined
  publishedAt: string | null | undefined
  deletedAt: string | null | undefined
  now: string
}

export function isPostUpcomingVisible(
  input: PostUpcomingVisibilityInput
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

  if (!input.publishedAt) {
    return false
  }

  return input.status === "scheduled" && input.publishedAt > input.now
}
