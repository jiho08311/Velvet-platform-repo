import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function startProjectionRebuildRun(input: {
  projectionName: string
  dryRun: boolean
}) {
  const { data, error } = await supabaseAdmin
    .from("projection_rebuild_runs")
    .insert({
      projection_name: input.projectionName,
      dry_run: input.dryRun,
      status: "running",
      result: {},
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single<{ id: string }>()

  if (error) throw error

  return data.id
}

export async function finishProjectionRebuildRun(input: {
  runId: string
  status: "succeeded" | "failed"
  result?: Record<string, unknown>
  errorMessage?: string
}) {
  const { error } = await supabaseAdmin
    .from("projection_rebuild_runs")
    .update({
      status: input.status,
      result: input.result ?? {},
      error_message: input.errorMessage ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", input.runId)

  if (error) throw error
}

export async function recordProjectionDriftReport(input: {
  checkName: string
  sourceCount: number | null
  projectionCount: number | null
  driftCount: number
  status: "ok" | "drift"
  details?: Record<string, unknown>
}) {
  const { error } = await supabaseAdmin
    .from("projection_drift_reports")
    .insert({
      check_name: input.checkName,
      source_count: input.sourceCount,
      projection_count: input.projectionCount,
      drift_count: input.driftCount,
      status: input.status,
      details: input.details ?? {},
      checked_at: new Date().toISOString(),
    })

  if (error) throw error
}

export async function recordProjectionHealthCheck(input: {
  projectionName: string
  projectionLag: number
  projectionDrift: number
  rebuildDurationMs?: number | null
  status: "ok" | "drift" | "rebuild_succeeded" | "rebuild_failed"
  metadata?: Record<string, unknown>
}) {
  const { error } = await supabaseAdmin
    .from("projection_health_checks")
    .insert({
      projection_name: input.projectionName,
      projection_lag: input.projectionLag,
      projection_drift: input.projectionDrift,
      rebuild_duration_ms: input.rebuildDurationMs ?? null,
      status: input.status,
      metadata: input.metadata ?? {},
      checked_at: new Date().toISOString(),
    })

  if (error) throw error
}

export async function recordProjectionShadowCompareResult(input: {
  surface: string
  entityType: string
  entityId?: string | null
  status: "matched" | "mismatched" | "missing_projection" | "missing_legacy"
  legacyHash?: string | null
  projectionHash?: string | null
  details?: Record<string, unknown>
}) {
  const { error } = await supabaseAdmin
    .from("projection_shadow_compare_results")
    .insert({
      surface: input.surface,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      status: input.status,
      legacy_hash: input.legacyHash ?? null,
      projection_hash: input.projectionHash ?? null,
      details: input.details ?? {},
      compared_at: new Date().toISOString(),
    })

  if (error) throw error
}