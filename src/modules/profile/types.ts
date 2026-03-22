export type ProfileId = string

export type Profile = {
  id: ProfileId
  userId: string
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
}