type PublicCreatorVisibilityInput = {
  status?:
    | "pending"
    | "active"
    | "suspended"
    | "inactive"
    | "banned"
    | string
    | null
    | undefined

  creatorVisibilityState?:
    | "public_candidate"
    | "visible"
    | "not_public"
    | string
    | null
    | undefined
}

export function isPublicCreatorVisible(
  input: PublicCreatorVisibilityInput
): boolean {
  if (
    input.creatorVisibilityState === "public_candidate" ||
    input.creatorVisibilityState === "visible"
  ) {
    return true
  }

  return false
}