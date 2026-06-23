import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type AudienceMetricRollupRow = {
  rollup_id: string
  creator_id: string

  period_start: string
  period_end: string

  subscriber_count: number
  active_subscribers: number
  new_subscribers: number
  churned_subscribers: number

  source_event_id: string | null
  idempotency_key: string

  computed_at: string
  created_at: string
}

export type UpsertAudienceMetricRollupInput = {
  creator_id: string

  period_start: string
  period_end: string

  subscriber_count?: number
  active_subscribers?: number
  new_subscribers?: number
  churned_subscribers?: number

  source_event_id?: string | null
  idempotency_key: string
}

export async function upsertAudienceMetricRollup(
  input: UpsertAudienceMetricRollupInput,
) {
  return supabaseAdmin
    .from("audience_metric_rollups")
    .upsert(
      {
        creator_id: input.creator_id,

        period_start: input.period_start,
        period_end: input.period_end,

        subscriber_count: input.subscriber_count ?? 0,
        active_subscribers: input.active_subscribers ?? 0,
        new_subscribers: input.new_subscribers ?? 0,
        churned_subscribers: input.churned_subscribers ?? 0,

        source_event_id: input.source_event_id ?? null,
        idempotency_key: input.idempotency_key,

        computed_at: new Date().toISOString(),
      },
      {
        onConflict: "idempotency_key",
      },
    )
    .select("*")
    .single<AudienceMetricRollupRow>()
}

export async function listAudienceMetricRollups(input?: {
  creatorId?: string
  periodStart?: string
  periodEnd?: string
  limit?: number
}) {
  let query = supabaseAdmin
    .from("audience_metric_rollups")
    .select("*")
    .order("computed_at", { ascending: false })
    .limit(input?.limit ?? 100)

  if (input?.creatorId) {
    query = query.eq("creator_id", input.creatorId)
  }

  if (input?.periodStart) {
    query = query.gte("period_start", input.periodStart)
  }

  if (input?.periodEnd) {
    query = query.lte("period_end", input.periodEnd)
  }

  const { data, error } =
    await query.returns<AudienceMetricRollupRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}