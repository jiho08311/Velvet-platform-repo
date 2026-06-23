import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type RevenueMetricRollupRow = {
  rollup_id: string
  creator_id: string | null
  period_start: string
  period_end: string
  gross_revenue: number
  net_revenue: number
  platform_fee: number
  refund_amount: number
  currency: string
  source_event_id: string | null
  idempotency_key: string
  computed_at: string
  created_at: string
}

export type UpsertRevenueMetricRollupInput = {
  creator_id: string | null
  period_start: string
  period_end: string
  gross_revenue?: number
  net_revenue?: number
  platform_fee?: number
  refund_amount?: number
  currency?: string
  source_event_id?: string | null
  idempotency_key: string
}

export async function upsertRevenueMetricRollup(
  input: UpsertRevenueMetricRollupInput
) {
  return supabaseAdmin
    .from("revenue_metric_rollups")
    .upsert(
      {
        creator_id: input.creator_id,
        period_start: input.period_start,
        period_end: input.period_end,
        gross_revenue: input.gross_revenue ?? 0,
        net_revenue: input.net_revenue ?? 0,
        platform_fee: input.platform_fee ?? 0,
        refund_amount: input.refund_amount ?? 0,
        currency: input.currency ?? "KRW",
        source_event_id: input.source_event_id ?? null,
        idempotency_key: input.idempotency_key,
        computed_at: new Date().toISOString(),
      },
      {
        onConflict: "idempotency_key",
      }
    )
    .select("*")
    .single<RevenueMetricRollupRow>()
}

export async function listRevenueMetricRollups(input: {
  creatorId?: string
  periodStart?: string
  periodEnd?: string
  limit?: number
}) {
  let query = supabaseAdmin
    .from("revenue_metric_rollups")
    .select("*")
    .order("computed_at", { ascending: false })
    .limit(input.limit ?? 100)

  if (input.creatorId) {
    query = query.eq("creator_id", input.creatorId)
  }

  if (input.periodStart) {
    query = query.gte("period_start", input.periodStart)
  }

  if (input.periodEnd) {
    query = query.lte("period_end", input.periodEnd)
  }

  const { data, error } = await query.returns<RevenueMetricRollupRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}