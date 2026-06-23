import { createHash } from "node:crypto"
import { isPublicCreatorProfileVisible } from "@/modules/creator/policies/is-public-creator-profile-visible"

export type CreatorPublicCardSource = {
  creator: {
    id: string
    user_id: string
    username: string | null
    display_name: string | null
    status: string | null
  }
  profile: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    bio: string | null
    is_deactivated?: boolean | null
    is_delete_pending?: boolean | null
    deleted_at?: string | null
    is_banned?: boolean | null
  } | null
  canonicalCreator: {
    creator_lifecycle_state: string | null
    creator_visibility_state: string | null
  } | null
  canonicalProfile: {
    profile_lifecycle_state: string | null
    identity_visibility_state: string | null
  } | null
}

function hashSource(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
}

export function buildCreatorPublicCard(source: CreatorPublicCardSource) {
  const username =
    source.creator.username ??
    source.profile?.username ??
    source.creator.id

  const displayName =
    source.creator.display_name ??
    source.profile?.display_name ??
    null

  const isPublicVisible = isPublicCreatorProfileVisible({
    creator: {
      status:
        source.canonicalCreator?.creator_lifecycle_state ??
        source.creator.status,
      creatorVisibilityState:
        source.canonicalCreator?.creator_visibility_state ?? null,
    },
    profile: {
      profileLifecycleState:
        source.canonicalProfile?.profile_lifecycle_state ?? null,
      identityVisibilityState:
        source.canonicalProfile?.identity_visibility_state ?? null,
      isDeactivated: source.profile?.is_deactivated,
      isDeletePending: source.profile?.is_delete_pending,
      deletedAt: source.profile?.deleted_at,
      isBanned: source.profile?.is_banned,
    },
  })

  return {
    creator_id: source.creator.id,
    user_id: source.creator.user_id,
    username,
    display_name: displayName,
    avatar_url: source.profile?.avatar_url ?? null,
    bio: source.profile?.bio ?? null,
    legacy_creator_status: source.creator.status,
    creator_lifecycle_state:
      source.canonicalCreator?.creator_lifecycle_state ?? null,
    creator_visibility_state:
      source.canonicalCreator?.creator_visibility_state ?? null,
    profile_lifecycle_state:
      source.canonicalProfile?.profile_lifecycle_state ?? null,
    identity_visibility_state:
      source.canonicalProfile?.identity_visibility_state ?? null,
    is_public_visible: isPublicVisible,
    source_hash: hashSource(source),
    projection_version: 1,
  }
}