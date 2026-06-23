import type { AdminCreatorRow } from "@/modules/admin/repositories/admin-creator-read-repository"

export type AdminCreator = {
  id: string
  userId: string
  username: string
  createdAt: string
}

export function mapAdminCreatorRow(row: AdminCreatorRow): AdminCreator {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    createdAt: row.created_at,
  }
}