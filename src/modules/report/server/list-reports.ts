import { requireAdmin } from "@/modules/admin/server/require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { ReportReviewListItem } from "@/modules/report/types"
import {
  buildReportReviewListItem,
  type ReportReviewListRow,
} from "@/modules/report/server/report-review-read-model"

type ListReportsParams = {
  limit?: number
  cursor?: string
}

type ListReportsResult = {
  data: ReportReviewListItem[]
  nextCursor: string | null
}

export async function listReports(
  params: ListReportsParams = {}
): Promise<ListReportsResult> {
  await requireAdmin()

  const limit = Math.min(params.limit ?? 50, 100)

  let query = supabaseAdmin
    .from("reports")
    .select(`
      id,
      target_type,
      target_id,
      reason,
      description,
      status,
      created_at,
      reporter:profiles!reports_reporter_id_fkey (
        id,
        email,
        username,
        display_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (params.cursor) {
    const safeCursor = decodeURIComponent(params.cursor).replace(" ", "+")
    query = query.lt("created_at", safeCursor)
  }

  const { data, error } = await query.returns<ReportReviewListRow[]>()

  if (error) {
    throw error
  }

  const rows = data ?? []

  const nextCursor =
    rows.length === limit ? rows[rows.length - 1].created_at : null

  return {
    data: rows.map(buildReportReviewListItem),
    nextCursor,
  }
}
