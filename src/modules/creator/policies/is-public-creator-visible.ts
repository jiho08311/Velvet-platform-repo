type PublicCreatorVisibilityInput = {
  status?: "pending" | "active" | "suspended" | "inactive" | "banned" | string | null | undefined
  creatorVisibilityState: "public_candidate" | "not_public" | string | null | undefined
}

export function isPublicCreatorVisible(
  input: PublicCreatorVisibilityInput
): boolean {
  if (input.creatorVisibilityState === "public_candidate") {
    return true
  }

  if (input.creatorVisibilityState === "not_public") {
    return false
  }

  return false
}