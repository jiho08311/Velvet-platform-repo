import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { AdminRole } from "@/modules/admin/policies/admin-role-policy"

export type AdminRoleAssignmentRow = {
  id: string
  profile_id: string
  role: AdminRole
}

export type AdminProfileIdRow = {
  profile_id: string
}

export type AdminUserRoleProfileRow = {
  role: AdminRole
  profiles:
    | {
        id: string
        email: string | null
        username: string | null
        display_name: string | null
      }
    | {
        id: string
        email: string | null
        username: string | null
        display_name: string | null
      }[]
    | null
}

type CanonicalAdminAuthorityRow = {
  admin_role_assignment_id: string | null
  profile_id: string | null
  role: AdminRole
  created_at?: string | null
}

type AdminProfileRow = {
  profile_id: string | null
  username: string | null
  display_name: string | null
  aggregate_metadata: Record<string, unknown> | null
}

function toAdminRoleAssignmentRow(
  row: CanonicalAdminAuthorityRow
): AdminRoleAssignmentRow | null {
  if (!row.admin_role_assignment_id || !row.profile_id) {
    return null
  }

  return {
    id: row.admin_role_assignment_id,
    profile_id: row.profile_id,
    role: row.role,
  }
}

type CanonicalAdminFilterQuery = PromiseLike<{
  data: unknown
  error: unknown
}> & {
  eq(column: string, value: unknown): CanonicalAdminFilterQuery
}

function applyCanonicalAdminFilters(query: unknown) {
  const filterableQuery = query as CanonicalAdminFilterQuery

  return filterableQuery
    .eq("serving_authoritative", true)
    .eq("authority_mode", "canonical_authoritative")
    .eq("enforcement_mode", "enforced")
}

function emailFromMetadata(metadata: Record<string, unknown> | null) {
  const value = metadata?.email
  return typeof value === "string" ? value : null
}

export async function listAdminRoleRowsByProfileId(
  profileId: string
): Promise<AdminRoleAssignmentRow[]> {
  const query = supabaseAdmin
    .from("canonical_identity_governance")
    .select("admin_role_assignment_id, profile_id, role")
    .eq("profile_id", profileId)

  const { data, error } = await applyCanonicalAdminFilters(query)

  if (error) {
    throw error
  }

  return ((data ?? []) as CanonicalAdminAuthorityRow[])
    .map(toAdminRoleAssignmentRow)
    .filter((row): row is AdminRoleAssignmentRow => Boolean(row))
}

export async function listAdminProfileIdRows(): Promise<AdminProfileIdRow[]> {
  const query = supabaseAdmin
    .from("canonical_identity_governance")
    .select("profile_id")

  const { data, error } = await applyCanonicalAdminFilters(query)

  if (error) {
    throw error
  }

  return ((data ?? []) as Pick<CanonicalAdminAuthorityRow, "profile_id">[])
    .filter((row): row is { profile_id: string } => Boolean(row.profile_id))
    .map((row) => ({ profile_id: row.profile_id }))
}

export async function listAdminUserRoleProfileRows(): Promise<
  AdminUserRoleProfileRow[]
> {
  const query = supabaseAdmin
    .from("canonical_identity_governance")
    .select("admin_role_assignment_id, profile_id, role, created_at")
    .order("created_at", { ascending: false })

  const { data: authorityRows, error: authorityError } =
    await applyCanonicalAdminFilters(query)

  if (authorityError) {
    throw authorityError
  }

  const rows = ((authorityRows ?? []) as CanonicalAdminAuthorityRow[]).filter(
    (row): row is CanonicalAdminAuthorityRow & { profile_id: string } =>
      Boolean(row.profile_id)
  )
  const profileIds = Array.from(new Set(rows.map((row) => row.profile_id)))

  if (profileIds.length === 0) {
    return []
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("canonical_profiles")
    .select("profile_id, username, display_name, aggregate_metadata")
    .in("profile_id", profileIds)
    .returns<AdminProfileRow[]>()

  if (profilesError) {
    throw profilesError
  }

  const profileById = new Map(
    ((profiles ?? []) as AdminProfileRow[])
      .filter((profile): profile is AdminProfileRow & { profile_id: string } =>
        Boolean(profile.profile_id)
      )
      .map((profile) => [
        profile.profile_id,
        {
          id: profile.profile_id,
          email: emailFromMetadata(profile.aggregate_metadata),
          username: profile.username,
          display_name: profile.display_name,
        },
      ])
  )

  return rows.map((row) => ({
    role: row.role,
    profiles: profileById.get(row.profile_id) ?? null,
  }))
}
