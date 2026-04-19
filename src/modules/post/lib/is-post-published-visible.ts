type PostPublishedVisibilityInput = {
  status: string | null | undefined
  visibility: string | null | undefined
  visibilityStatus: string | null | undefined
  moderationStatus: string | null | undefined
  deletedAt: string | null | undefined
}

function isSupportedPublicVisibility(
  visibility: string | null | undefined
): boolean {
  return visibility === "public" || visibility === "subscribers"
}

export function isPostPublishedVisible(
  input: PostPublishedVisibilityInput
): boolean {
  if (input.deletedAt) {
    return false
  }

  if (!isSupportedPublicVisibility(input.visibility)) {
    return false
  }

  if (input.status !== "published") {
    return false
  }

  if (input.visibilityStatus !== "published") {
    return false
  }

  if (input.moderationStatus !== "approved") {
    return false
  }

  return true
}