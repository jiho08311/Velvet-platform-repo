type PublicProfileVisibilityInput = {
  isDeactivated: boolean | null | undefined
  isDeletePending: boolean | null | undefined
  deletedAt: string | null | undefined
  isBanned: boolean | null | undefined
}

export function isPublicProfileVisible(
  input: PublicProfileVisibilityInput
): boolean {
  if (input.isDeactivated) {
    return false
  }

  if (input.isDeletePending) {
    return false
  }

  if (input.deletedAt) {
    return false
  }

  if (input.isBanned) {
    return false
  }

  return true
}