import { isPublicCreatorVisible } from "./is-public-creator-visible"
import { isPublicProfileVisible } from "./is-public-profile-visible"

export type PublicCreatorVisibilityRecord = {
  status: string | null | undefined
  creatorVisibilityState?: string | null | undefined
}

export type PublicProfileVisibilityRecord = {
  profileLifecycleState?: string | null | undefined
  identityVisibilityState?: string | null | undefined

  isDeactivated?: boolean | null | undefined
  isDeletePending?: boolean | null | undefined
  deletedAt?: string | null | undefined
  isBanned?: boolean | null | undefined
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
    creatorVisibilityState: creator.creatorVisibilityState,
  })

  if (!isVisibleCreator) {
    return false
  }

  const isVisibleProfile = isPublicProfileVisible({
    profileLifecycleState: profile.profileLifecycleState,
    identityVisibilityState: profile.identityVisibilityState,
    isDeactivated: profile.isDeactivated,
    isDeletePending: profile.isDeletePending,
    deletedAt: profile.deletedAt,
    isBanned: profile.isBanned,
  })

  return isVisibleProfile
}