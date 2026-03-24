export type UserId = string

export type UserRole = "fan" | "creator" | "admin"

export type UserStatus = "active" | "suspended" | "deleted"

export type User = {
  id: UserId
  email: string
  username: string
  role: UserRole
  status: UserStatus
  createdAt: string
}