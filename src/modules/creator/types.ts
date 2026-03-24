export type CreatorId = string
export type CreatorUserId = string

export type Creator = {
  id: CreatorId
  userId: CreatorUserId
  username: string
  displayName: string
  bio: string | null
  status: "pending" | "active" | "suspended"
  createdAt: string
}