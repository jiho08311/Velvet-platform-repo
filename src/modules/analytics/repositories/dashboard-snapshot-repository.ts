import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type CreatorDashboardSnapshotRow = {
  creator_id: string
  metrics: Record<string, unknown>
  source_hash: string | null
  projection_version: number
  computed_at: string
}

export type AdminDashboardSnapshotRow = {
  snapshot_key: string
  metrics: Record<string, unknown>
  source_hash: string | null
  projection_version: number
  computed_at: string
}

export async function upsertCreatorDashboardSnapshot(
  row: Omit<CreatorDashboardSnapshotRow, "computed_at">
) {
  return supabaseAdmin
    .from("creator_dashboard_snapshots")
    .upsert(
      {
        ...row,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "creator_id" }
    )
    .select("*")
    .single<CreatorDashboardSnapshotRow>()
}

export async function upsertAdminDashboardSnapshot(
  row: Omit<AdminDashboardSnapshotRow, "computed_at">
) {
  return supabaseAdmin
    .from("admin_dashboard_snapshots")
    .upsert(
      {
        ...row,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "snapshot_key" }
    )
    .select("*")
    .single<AdminDashboardSnapshotRow>()
}

export async function readCreatorDashboardSnapshot(
  creatorId: string
): Promise<CreatorDashboardSnapshotRow | null> {
  const { data, error } = await supabaseAdmin
    .from("creator_dashboard_snapshots")
    .select("*")
    .eq("creator_id", creatorId)
    .maybeSingle<CreatorDashboardSnapshotRow>()

  if (error) throw error

  return data ?? null
}

export async function readAdminDashboardSnapshot(
  snapshotKey = "platform"
): Promise<AdminDashboardSnapshotRow | null> {
  const { data, error } = await supabaseAdmin
    .from("admin_dashboard_snapshots")
    .select("*")
    .eq("snapshot_key", snapshotKey)
    .maybeSingle<AdminDashboardSnapshotRow>()

  if (error) throw error

  return data ?? null
}
