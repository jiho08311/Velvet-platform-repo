import { isPostPublishedVisible } from "./is-post-published-visible"
import { isPostUpcomingVisible } from "./is-post-upcoming-visible"

export type GetPostPublicStateInput = {
  status: string | null | undefined
  visibility: string | null | undefined
  visibilityStatus: string | null | undefined
  moderationStatus: string | null | undefined
  publishedAt: string | null | undefined
  deletedAt: string | null | undefined
  now: string
}

export type PostPublicState = "hidden" | "upcoming" | "published"

function isPublishedPost(
  input: GetPostPublicStateInput
): boolean {
  return isPostPublishedVisible({
    status: input.status,
    visibility: input.visibility,
    visibilityStatus: input.visibilityStatus,
    moderationStatus: input.moderationStatus,
    deletedAt: input.deletedAt,
  })
}

function isUpcomingPost(
  input: GetPostPublicStateInput
): boolean {
  return isPostUpcomingVisible({
    status: input.status,
    visibility: input.visibility,
    moderationStatus: input.moderationStatus,
    publishedAt: input.publishedAt,
    deletedAt: input.deletedAt,
    now: input.now,
  })
}

export function getPostPublicState(
  input: GetPostPublicStateInput
): PostPublicState {
  if (isPublishedPost(input)) {
    return "published"
  }

  if (isUpcomingPost(input)) {
    return "upcoming"
  }

  return "hidden"
}
