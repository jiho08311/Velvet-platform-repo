import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { AdminUserCreatorDetailRow } from "@/modules/admin/mappers/admin-creator-detail-mapper"

export type AdminCreatorRow = {
  id: string
  user_id: string
  username: string
  created_at: string
}

type CanonicalAdminCreatorRow = {
  creator_id: string | null
  user_id: string | null
  username: string | null
  status: string | null
  aggregate_metadata: Record<string, unknown> | null
  created_at: string
}

const ADMIN_CREATOR_SELECT =
  "creator_id, user_id, username, status, aggregate_metadata, created_at"

function toAdminCreatorRow(row: CanonicalAdminCreatorRow): AdminCreatorRow | null {
  if (!row.creator_id || !row.user_id) {
    return null
  }

  return {
    id: row.creator_id,
    user_id: row.user_id,
    username: row.username ?? "",
    created_at: row.created_at,
  }
}

function subscriptionPrice(metadata: Record<string, unknown> | null): number {
  const value = metadata?.subscriptionPrice
  return typeof value === "number" ? value : 0
}

export async function listAdminCreatorRows(): Promise<AdminCreatorRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_creators")
    .select(ADMIN_CREATOR_SELECT)
    .order("created_at", { ascending: false })
    .returns<CanonicalAdminCreatorRow[]>()

  if (error) {
    throw error
  }

  return (data ?? [])
    .map(toAdminCreatorRow)
    .filter((row): row is AdminCreatorRow => Boolean(row))
}

export async function findAdminCreatorRowById(
  creatorId: string
): Promise<AdminCreatorRow | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_creators")
    .select(ADMIN_CREATOR_SELECT)
    .eq("creator_id", creatorId)
    .maybeSingle<CanonicalAdminCreatorRow>()

  if (error) {
    throw error
  }

  return data ? toAdminCreatorRow(data) : null
}

export async function findAdminCreatorDetailRowByUserId(
  userId: string
): Promise<AdminUserCreatorDetailRow | null> {
  const { data } = await supabaseAdmin
    .from("canonical_creators")
    .select("creator_id, status, aggregate_metadata")
    .eq("user_id", userId)
    .maybeSingle<{
      creator_id: string | null
      status: string | null
      aggregate_metadata: Record<string, unknown> | null
    }>()

  if (!data?.creator_id) {
    return null
  }

  return {
    id: data.creator_id,
    status: data.status ?? "pending",
    subscription_price: subscriptionPrice(data.aggregate_metadata),
  } as AdminUserCreatorDetailRow
}
