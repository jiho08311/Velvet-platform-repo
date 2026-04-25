import { isPublicCreatorVisible } from "./is-public-creator-visible"
import { isPublicProfileVisible } from "./is-public-profile-visible"

export type PublicCreatorVisibilityRecord = {
  status: string | null | undefined
}

export type PublicProfileVisibilityRecord = {
  isDeactivated: boolean | null | undefined
  isDeletePending: boolean | null | undefined
  deletedAt: string | null | undefined
  isBanned: boolean | null | undefined
}

export type PublicCreatorProfileVisibilityInput = {
  creator: PublicCreatorVisibilityRecord | null | undefined
  profile: PublicProfileVisibilityRecord | null | undefined
}

export function isPublicCreatorProfileVisible(
  input: PublicCreatorProfileVisibilityInput
): boolean {
  const { creator, profile } = input

  if (!creator || !profile) {
    return false
  }

  const isVisibleCreator = isPublicCreatorVisible({
    status: creator.status,
  })

  if (!isVisibleCreator) {
    return false
  }

  const isVisibleProfile = isPublicProfileVisible({
    isDeactivated: profile.isDeactivated,
    isDeletePending: profile.isDeletePending,
    deletedAt: profile.deletedAt,
    isBanned: profile.isBanned,
  })

  if (!isVisibleProfile) {
    return false
  }

  return true
}
