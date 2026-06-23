import type {
  ResolvedStoryRow,
  StoryRow,
} from "@/modules/story/runtime/get-stories-types"

function pickJoinedRow<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

export function resolveStoryRow(
  row: StoryRow,
  now: string
): ResolvedStoryRow {
  const creator = pickJoinedRow(row.creators)
  const profile = pickJoinedRow(creator?.profiles ?? null)

  return {
    row,
    creatorRow: creator
      ? {
          id: creator.id,
          user_id: creator.user_id,
          username: creator.username,
          display_name: creator.display_name,
          status: creator.status,
          creator_visibility_state: creator.creator_visibility_state,
        }
      : null,
    profileRow: profile,
    eligibilityInput: {
      now,
      story: {
        isDeleted: row.is_deleted,
        expiresAt: row.expires_at,
      },
      creator: creator
        ? {
            status: creator.status,
            creatorVisibilityState: creator.creator_visibility_state,
          }
        : null,
      profile: profile
        ? {
            profileLifecycleState: profile.profile_lifecycle_state,
            identityVisibilityState: profile.identity_visibility_state,
            isDeactivated: profile.is_deactivated,
            isDeletePending: profile.is_delete_pending,
            deletedAt: profile.deleted_at,
            isBanned: profile.is_banned,
          }
        : null,
    },
    creatorSurface: creator
      ? {
          id: creator.id,
          username: creator.username,
          displayName: creator.display_name,
          avatarUrl: profile?.avatar_url ?? null,
        }
      : null,
  }
}
