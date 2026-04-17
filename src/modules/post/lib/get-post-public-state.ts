import { isPostPublishedVisible } from "./is-post-published-visible"
import { isPostUpcomingVisible } from "./is-post-upcoming-visible"

type GetPostPublicStateInput = {
  status: string | null | undefined
  visibility: string | null | undefined
  visibilityStatus: string | null | undefined
  moderationStatus: string | null | undefined
  publishedAt: string | null | undefined
  deletedAt: string | null | undefined
  now: string
}

export type PostPublicState = "hidden" | "upcoming" | "published"

export function getPostPublicState(
  input: GetPostPublicStateInput
): PostPublicState {
  if (
    isPostPublishedVisible({
      status: input.status,
      visibility: input.visibility,
      visibilityStatus: input.visibilityStatus,
      moderationStatus: input.moderationStatus,
      deletedAt: input.deletedAt,
    })
  ) {
    return "published"
  }

  if (
    isPostUpcomingVisible({
      status: input.status,
      visibility: input.visibility,
      moderationStatus: input.moderationStatus,
      publishedAt: input.publishedAt,
      deletedAt: input.deletedAt,
      now: input.now,
    })
  ) {
    return "upcoming"
  }

  return "hidden"
}