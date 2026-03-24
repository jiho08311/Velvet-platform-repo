export type UserId = string

export type User = {
  id: UserId
  email: string | null
  username: string
  createdAt: string
}