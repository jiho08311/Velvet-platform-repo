import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ResolveReportParams = {
  reportId: string
}

type ReportRow = {
  id: string
  status: string
  resolved_at: string | null
}

export type ResolvedReport = {
  id: string
  status: string
  resolvedAt: string | null
}

export async function resolveReport({
  reportId,
}: ResolveReportParams): Promise<ResolvedReport> {
  const supabase = await createSupabaseServerClient()

  const resolvedAt = new Date().toISOString()

  const { data, error } = await supabase
    .from("reports")
    .update({
      status: "resolved",
      resolved_at: resolvedAt,
    })
    .eq("id", reportId)
    .select("id, status, resolved_at")
    .single<ReportRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    status: data.status,
    resolvedAt: data.resolved_at,
  }
}