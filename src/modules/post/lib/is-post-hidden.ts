import { getPostPublicState } from "./get-post-public-state"

type PostHiddenInput = {
  status: string | null | undefined
  visibility: string | null | undefined
  visibilityStatus: string | null | undefined
  moderationStatus: string | null | undefined
  publishedAt: string | null | undefined
  deletedAt: string | null | undefined
  now: string
}

export function isPostHidden(input: PostHiddenInput): boolean {
  return (
    getPostPublicState({
      status: input.status,
      visibility: input.visibility,
      visibilityStatus: input.visibilityStatus,
      moderationStatus: input.moderationStatus,
      publishedAt: input.publishedAt,
      deletedAt: input.deletedAt,
      now: input.now,
    }) === "hidden"
  )
}