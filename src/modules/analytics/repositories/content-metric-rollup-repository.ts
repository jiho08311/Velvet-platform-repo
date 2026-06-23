import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type ContentMetricRollupRow = {
  rollup_id: string
  content_id: string | null
  creator_id: string

  period_start: string
  period_end: string

  views: number
  likes: number
  comments: number
  engagement_rate: number

  source_event_id: string | null
  idempotency_key: string

  computed_at: string
  created_at: string
}

export type UpsertContentMetricRollupInput = {
  content_id?: string | null
  creator_id: string

  period_start: string
  period_end: string

  views?: number
  likes?: number
  comments?: number
  engagement_rate?: number

  source_event_id?: string | null
  idempotency_key: string
}

export async function upsertContentMetricRollup(
  input: UpsertContentMetricRollupInput
) {
  return supabaseAdmin
    .from("content_metric_rollups")
    .upsert(
      {
        content_id: input.content_id ?? null,
        creator_id: input.creator_id,

        period_start: input.period_start,
        period_end: input.period_end,

        views: input.views ?? 0,
        likes: input.likes ?? 0,
        comments: input.comments ?? 0,
        engagement_rate: input.engagement_rate ?? 0,

        source_event_id: input.source_event_id ?? null,
        idempotency_key: input.idempotency_key,

        computed_at: new Date().toISOString(),
      },
      {
        onConflict: "idempotency_key",
      }
    )
    .select("*")
    .single<ContentMetricRollupRow>()
}

export async function listContentMetricRollups(input?: {
  creatorId?: string
  contentId?: string
  periodStart?: string
  periodEnd?: string
  limit?: number
}) {
  let query = supabaseAdmin
    .from("content_metric_rollups")
    .select("*")
    .order("computed_at", { ascending: false })
    .limit(input?.limit ?? 100)

  if (input?.creatorId) {
    query = query.eq("creator_id", input.creatorId)
  }

  if (input?.contentId) {
    query = query.eq("content_id", input.contentId)
  }

  if (input?.periodStart) {
    query = query.gte("period_start", input.periodStart)
  }

  if (input?.periodEnd) {
    query = query.lte("period_end", input.periodEnd)
  }

  const { data, error } = await query.returns<ContentMetricRollupRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}