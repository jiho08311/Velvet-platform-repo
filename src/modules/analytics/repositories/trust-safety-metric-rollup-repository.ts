import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type TrustSafetyMetricRollupRow = {
  rollup_id: string

  period_start: string
  period_end: string

  reports_received: number
  cases_reviewed: number
  actions_issued: number
  content_removed: number
  users_suspended: number

  source_event_id: string | null
  idempotency_key: string

  computed_at: string
  created_at: string
}

export type UpsertTrustSafetyMetricRollupInput = {
  period_start: string
  period_end: string

  reports_received?: number
  cases_reviewed?: number
  actions_issued?: number
  content_removed?: number
  users_suspended?: number

  source_event_id?: string | null
  idempotency_key: string
}

export async function upsertTrustSafetyMetricRollup(
  input: UpsertTrustSafetyMetricRollupInput
) {
  return supabaseAdmin
    .from("trust_safety_metric_rollups")
    .upsert(
      {
        period_start: input.period_start,
        period_end: input.period_end,

        reports_received: input.reports_received ?? 0,
        cases_reviewed: input.cases_reviewed ?? 0,
        actions_issued: input.actions_issued ?? 0,
        content_removed: input.content_removed ?? 0,
        users_suspended: input.users_suspended ?? 0,

        source_event_id: input.source_event_id ?? null,
        idempotency_key: input.idempotency_key,

        computed_at: new Date().toISOString(),
      },
      {
        onConflict: "idempotency_key",
      }
    )
    .select("*")
    .single<TrustSafetyMetricRollupRow>()
}

export async function listTrustSafetyMetricRollups(input?: {
  periodStart?: string
  periodEnd?: string
  limit?: number
}) {
  let query = supabaseAdmin
    .from("trust_safety_metric_rollups")
    .select("*")
    .order("computed_at", { ascending: false })
    .limit(input?.limit ?? 100)

  if (input?.periodStart) {
    query = query.gte("period_start", input.periodStart)
  }

  if (input?.periodEnd) {
    query = query.lte("period_end", input.periodEnd)
  }

  const { data, error } = await query.returns<TrustSafetyMetricRollupRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}