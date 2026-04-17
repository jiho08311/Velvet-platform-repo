type PublicCreatorVisibilityInput = {
  status: "pending" | "active" | "suspended" | "inactive" | "banned" | string | null | undefined
}

export function isPublicCreatorVisible(
  input: PublicCreatorVisibilityInput
): boolean {
  return input.status === "active"
}