type PostUpcomingVisibilityInput = {
  status: string | null | undefined
  visibility: string | null | undefined
  moderationStatus: string | null | undefined
  publishedAt: string | null | undefined
  deletedAt: string | null | undefined
  now: string
}

function isSupportedPublicVisibility(
  visibility: string | null | undefined
): boolean {
  return visibility === "public" || visibility === "subscribers"
}

export function isPostUpcomingVisible(
  input: PostUpcomingVisibilityInput
): boolean {
  if (input.deletedAt) {
    return false
  }

  if (!isSupportedPublicVisibility(input.visibility)) {
    return false
  }

  if (input.status !== "scheduled") {
    return false
  }

  if (input.moderationStatus !== "approved") {
    return false
  }

  if (!input.publishedAt) {
    return false
  }

  if (input.publishedAt <= input.now) {
    return false
  }

  return true
}