import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type AnalyticsRollupRow = {
  id: string
  rollup_key: string
  rollup_type: string
  subject_type: string
  subject_id: string | null
  window_start: string | null
  window_end: string | null
  metrics: Record<string, unknown>
  source_hash: string | null
  projection_version: number
  computed_at: string
}

export type UpsertAnalyticsRollupInput = Omit<
  AnalyticsRollupRow,
  "id" | "computed_at"
>

export async function upsertAnalyticsRollup(row: UpsertAnalyticsRollupInput) {
  return supabaseAdmin
    .from("analytics_rollups")
    .upsert(
      {
        ...row,
        computed_at: new Date().toISOString(),
      },
      {
        onConflict: "rollup_key",
      }
    )
    .select("*")
    .single<AnalyticsRollupRow>()
}

export async function listAnalyticsRollups(input: {
  rollupType: string
  subjectType?: string
  subjectId?: string
  limit?: number
}): Promise<AnalyticsRollupRow[]> {
  let query = supabaseAdmin
    .from("analytics_rollups")
    .select("*")
    .eq("rollup_type", input.rollupType)
    .order("computed_at", { ascending: false })
    .limit(input.limit ?? 100)

  if (input.subjectType) {
    query = query.eq("subject_type", input.subjectType)
  }

  if (input.subjectId) {
    query = query.eq("subject_id", input.subjectId)
  }

  const { data, error } = await query.returns<AnalyticsRollupRow[]>()

  if (error) throw error

  return data ?? []
}
