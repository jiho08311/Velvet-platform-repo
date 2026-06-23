import { isPostPublicBaseVisible } from "./is-post-public-base-visible"

type PostUpcomingVisibilityInput = {
  status?: string | null | undefined
  visibility?: string | null | undefined
  moderationStatus?: string | null | undefined
  publishedAt?: string | null | undefined
  deletedAt?: string | null | undefined
  now: string

  feedVisibilityState?: string | null | undefined
  isFeedVisible?: boolean | null | undefined
}

export function isPostUpcomingVisible(
  input: PostUpcomingVisibilityInput
): boolean {
  if (input.feedVisibilityState || input.isFeedVisible !== undefined) {
    return (
      input.isFeedVisible === true &&
      input.feedVisibilityState === "upcoming_visible"
    )
  }

  return false
}