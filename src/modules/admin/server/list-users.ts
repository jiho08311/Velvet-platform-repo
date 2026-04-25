import { requireAdmin } from "./require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  buildAdminUserOperationalModel,
  type AdminUserOperationalModel,
  type AdminUserOperationalRow,
} from "@/modules/admin/lib/admin-user-operational-policy"

type ListUsersParams = {
  limit?: number
}

export async function listUsers(
  params: ListUsersParams = {}
): Promise<AdminUserOperationalModel[]> {
  await requireAdmin()

  const limit = Math.min(params.limit ?? 50, 100)

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, email, username, display_name, is_deactivated, is_banned, is_delete_pending, delete_scheduled_for, deleted_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<AdminUserOperationalRow[]>()

  if (error) {
    throw error
  }

  return (data ?? []).map(buildAdminUserOperationalModel)
}
