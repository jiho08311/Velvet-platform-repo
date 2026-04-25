import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import type { ReportStatus } from "@/modules/report/types"

type ResolveReportParams = {
  reportId: string
}

type ReportRow = {
  id: string
  status: ReportStatus
  reviewed_at: string | null
}

export type ResolvedReport = {
  id: string
  status: ReportStatus
  reviewedAt: string | null
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
      reviewed_at: resolvedAt,
    })
    .eq("id", reportId)
    .select("id, status, reviewed_at")
    .single<ReportRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    status: data.status,
    reviewedAt: data.reviewed_at,
  }
}
