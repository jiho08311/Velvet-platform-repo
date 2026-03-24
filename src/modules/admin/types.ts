export type AdminUserId = string

export type AdminUser = {
  id: AdminUserId
  email: string | null
  role: "admin"
  createdAt: string
}