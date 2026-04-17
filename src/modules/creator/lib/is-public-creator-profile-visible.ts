import { isPublicCreatorVisible } from "./is-public-creator-visible"
import { isPublicProfileVisible } from "./is-public-profile-visible"

type PublicCreatorProfileVisibilityInput = {
  creator: {
    status: string | null | undefined
  } | null | undefined
  profile: {
    isDeactivated: boolean | null | undefined
    isDeletePending: boolean | null | undefined
    deletedAt: string | null | undefined
    isBanned: boolean | null | undefined
  } | null | undefined
}

export function isPublicCreatorProfileVisible(
  input: PublicCreatorProfileVisibilityInput
): boolean {
  if (!input.creator || !input.profile) {
    return false
  }

  if (
    !isPublicCreatorVisible({
      status: input.creator.status,
    })
  ) {
    return false
  }

  if (
    !isPublicProfileVisible({
      isDeactivated: input.profile.isDeactivated,
      isDeletePending: input.profile.isDeletePending,
      deletedAt: input.profile.deletedAt,
      isBanned: input.profile.isBanned,
    })
  ) {
    return false
  }

  return true
}