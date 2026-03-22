export type PublicProfile = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string
}

export async function getProfileByUsername(
  username: string
): Promise<PublicProfile | null> {
  return null
}