import type {
  PublicCreatorProfileVisibilityInput,
  PublicCreatorVisibilityRecord,
  PublicProfileVisibilityRecord,
} from "./is-public-creator-profile-visible"

type BuildPublicCreatorProfileVisibilityInput = {
  creator:
    | (PublicCreatorVisibilityRecord & {
        creator_visibility_state?: string | null | undefined
      })
    | null
    | undefined
  profile:
    | (PublicProfileVisibilityRecord & {
        profile_lifecycle_state?: string | null | undefined
        identity_visibility_state?: string | null | undefined
        is_deactivated?: boolean | null | undefined
        is_delete_pending?: boolean | null | undefined
        deleted_at?: string | null | undefined
        is_banned?: boolean | null | undefined
      })
    | null
    | undefined
}

export function buildPublicCreatorProfileVisibilityInput(
  input: BuildPublicCreatorProfileVisibilityInput,
): PublicCreatorProfileVisibilityInput {
  return {
    creator: input.creator
      ? {
          status: input.creator.status,
          creatorVisibilityState:
            input.creator.creatorVisibilityState ??
            input.creator.creator_visibility_state,
        }
      : null,
    profile: input.profile
      ? {
          profileLifecycleState:
            input.profile.profileLifecycleState ??
            input.profile.profile_lifecycle_state,
          identityVisibilityState:
            input.profile.identityVisibilityState ??
            input.profile.identity_visibility_state,
          isDeactivated: input.profile.isDeactivated ?? input.profile.is_deactivated,
          isDeletePending:
            input.profile.isDeletePending ?? input.profile.is_delete_pending,
          deletedAt: input.profile.deletedAt ?? input.profile.deleted_at,
          isBanned: input.profile.isBanned ?? input.profile.is_banned,
        }
      : null,
  }
}