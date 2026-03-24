export type ProfileId = string

export type Profile = {
  id: ProfileId
  email: string
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  createdAt: string
}