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
  if (input.deletedAt) {
    return false
  }

  if (input.status !== "published") {
    return false
  }

if (input.visibility !== "public" && input.visibility !== "subscribers") {
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