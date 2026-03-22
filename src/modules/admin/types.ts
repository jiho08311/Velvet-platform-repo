export type AdminUserId = string

export type AdminUser = {
  id: AdminUserId
  email: string
  role: "admin"
  createdAt: string
}