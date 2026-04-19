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
  const isPublished = isPostPublishedVisible({
    status: input.status,
    visibility: input.visibility,
    visibilityStatus: input.visibilityStatus,
    moderationStatus: input.moderationStatus,
    deletedAt: input.deletedAt,
  })

  if (isPublished) {
    return "published"
  }

  const isUpcoming = isPostUpcomingVisible({
    status: input.status,
    visibility: input.visibility,
    moderationStatus: input.moderationStatus,
    publishedAt: input.publishedAt,
    deletedAt: input.deletedAt,
    now: input.now,
  })

  if (isUpcoming) {
    return "upcoming"
  }

  return "hidden"
}