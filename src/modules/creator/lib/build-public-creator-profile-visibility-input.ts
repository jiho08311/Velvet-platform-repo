import type {
  PublicCreatorProfileVisibilityInput,
  PublicCreatorVisibilityRecord,
  PublicProfileVisibilityRecord,
} from "./is-public-creator-profile-visible"

type BuildPublicCreatorProfileVisibilityInput = {
  creator: PublicCreatorVisibilityRecord | null | undefined
  profile: {
    is_deactivated: boolean | null | undefined
    is_delete_pending: boolean | null | undefined
    deleted_at: string | null | undefined
    is_banned: boolean | null | undefined
  } | null | undefined
}

export function buildPublicCreatorProfileVisibilityInput(
  input: BuildPublicCreatorProfileVisibilityInput
): PublicCreatorProfileVisibilityInput {
  return {
    creator: input.creator,
    profile: input.profile
      ? {
          isDeactivated: input.profile.is_deactivated,
          isDeletePending: input.profile.is_delete_pending,
          deletedAt: input.profile.deleted_at,
          isBanned: input.profile.is_banned,
        }
      : null,
  }
}
