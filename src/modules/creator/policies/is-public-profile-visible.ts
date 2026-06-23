type PublicProfileLifecycleState =
  | "active"
  | "deactivated"
  | "delete_pending"

type IdentityVisibilityState = "visible" | "not_visible"

type PublicProfileVisibilityInput = {
  profileLifecycleState: PublicProfileLifecycleState | string | null | undefined
  identityVisibilityState: IdentityVisibilityState | string | null | undefined

  isDeactivated?: boolean | null | undefined
  isDeletePending?: boolean | null | undefined
  deletedAt?: string | null | undefined
  isBanned?: boolean | null | undefined
}

export function isPublicProfileVisible(
  input: PublicProfileVisibilityInput
): boolean {
  if (input.identityVisibilityState === "visible") {
    return true
  }

  if (input.identityVisibilityState === "not_visible") {
    return false
  }

  if (input.profileLifecycleState === "active") {
    return true
  }

  if (
    input.profileLifecycleState === "deactivated" ||
    input.profileLifecycleState === "delete_pending"
  ) {
    return false
  }

  return false
}