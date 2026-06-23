import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { AdminUserOperationalRow } from "@/modules/admin/mappers/admin-user-operational-mapper"

type AdminUserRow = {
  id: string
  email: string | null
  created_at: string
}

type CanonicalProfileAdminRow = {
  profile_id: string | null
  username: string | null
  display_name: string | null
  profile_lifecycle_state: string | null
  identity_visibility_state: string | null
  aggregate_metadata: Record<string, unknown> | null
  created_at: string
}

const ADMIN_CANONICAL_PROFILE_SELECT =
  "profile_id, username, display_name, profile_lifecycle_state, identity_visibility_state, aggregate_metadata, created_at"

function stringMetadata(
  metadata: Record<string, unknown> | null,
  key: string
): string | null {
  const value = metadata?.[key]
  return typeof value === "string" ? value : null
}

function toAdminUserOperationalRow(
  row: CanonicalProfileAdminRow
): AdminUserOperationalRow {
  const lifecycle = row.profile_lifecycle_state ?? "active"
  const metadata = row.aggregate_metadata ?? {}

  return {
    id: row.profile_id ?? "",
    email: stringMetadata(metadata, "email"),
    username: row.username,
    display_name: row.display_name,
    is_deactivated: lifecycle === "deactivated",
    is_banned:
      lifecycle === "banned" || row.identity_visibility_state === "not_visible",
    is_delete_pending: lifecycle === "delete_pending",
    delete_scheduled_for: stringMetadata(metadata, "deleteScheduledFor"),
    deleted_at:
      lifecycle === "delete_pending" ? stringMetadata(metadata, "deletedAt") : null,
    created_at: row.created_at,
  } as AdminUserOperationalRow
}

export async function listAdminUserOperationalRows(
  limit: number
): Promise<AdminUserOperationalRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select(ADMIN_CANONICAL_PROFILE_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<CanonicalProfileAdminRow[]>()

  if (error) {
    throw error
  }

  return (data ?? []).map(toAdminUserOperationalRow)
}

export async function findAdminUserRowById(
  userId: string
): Promise<AdminUserRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id, aggregate_metadata, created_at")
    .eq("profile_id", userId)
    .maybeSingle<Pick<CanonicalProfileAdminRow, "profile_id" | "aggregate_metadata" | "created_at">>()

  if (error) {
    throw error
  }

  if (!data?.profile_id) {
    return null
  }

  return {
    id: data.profile_id,
    email: stringMetadata(data.aggregate_metadata, "email"),
    created_at: data.created_at,
  }
}

export async function getAdminUserOperationalRowById(
  userId: string
): Promise<AdminUserOperationalRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_profiles")
    .select(ADMIN_CANONICAL_PROFILE_SELECT)
    .eq("profile_id", userId)
    .single<CanonicalProfileAdminRow>()

  if (error) {
    throw error
  }

  return toAdminUserOperationalRow(data)
}
