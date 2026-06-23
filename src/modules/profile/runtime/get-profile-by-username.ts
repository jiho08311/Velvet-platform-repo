import { isPublicProfileVisible } from "@/modules/creator/public/public-creator-profile-visibility"
import { readPublicProfileRowByUsername } from "@/modules/profile/repositories/profile-read-repository"

export type PublicProfile = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
}

export async function getProfileByUsername(
  username: string
): Promise<PublicProfile | null> {
  const { data, error } = await readPublicProfileRowByUsername(username)

  if (error) {
    throw error
  }

  if (
    !data ||
    !isPublicProfileVisible({
      isDeactivated: data.is_deactivated,
      isDeletePending: data.is_delete_pending,
      deletedAt: data.deleted_at,
      isBanned: data.is_banned,
    profileLifecycleState: "active",
identityVisibilityState: "visible",
    })
  ) {
    return null
  }

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    bio: data.bio,
  }
}