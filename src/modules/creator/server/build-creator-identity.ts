type CreatorIdentityCreatorRow = {
  id: string
  user_id: string
  username?: string | null
}

type CreatorIdentityProfileRow = {
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
  bio?: string | null
} | null

export type CreatorIdentity = {
  id: string
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string
}

export function buildCreatorIdentity(input: {
  creator: CreatorIdentityCreatorRow
  profile: CreatorIdentityProfileRow
}): CreatorIdentity {
  const creatorUsername =
    typeof input.creator.username === "string"
      ? input.creator.username.trim()
      : ""
  const profileUsername =
    typeof input.profile?.username === "string"
      ? input.profile.username.trim()
      : ""
  const username = profileUsername || creatorUsername
  const displayName =
    (typeof input.profile?.display_name === "string"
      ? input.profile.display_name.trim()
      : "") ||
    username ||
    "Creator"

  return {
    id: input.creator.id,
    userId: input.creator.user_id,
    username,
    displayName,
    avatarUrl:
      typeof input.profile?.avatar_url === "string"
        ? input.profile.avatar_url
        : null,
    bio:
      typeof input.profile?.bio === "string"
        ? input.profile.bio
        : "",
  }
}
