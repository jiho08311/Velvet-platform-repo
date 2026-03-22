import { createClient } from "@/infrastructure/supabase/server"

export type AdminReportListItem = {
  id: string
  targetType: string
  targetId: string
  reporterUserId: string
  reason: string
  status: "pending" | "reviewed" | "dismissed" | "actioned"
  createdAt: string
}

export type GetReportsInput = {
  limit?: number
  cursor?: string | null
}

export type GetReportsResult = {
  items: AdminReportListItem[]
  nextCursor: string | null
}

export async function getReports(
  input: GetReportsInput = {}
): Promise<GetReportsResult> {
  const supabase = await createClient()
  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))

  let query = supabase
    .from("reports")
    .select("id, target_type, target_id, reporter_user_id, reason, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit + 1)

  if (input.cursor) {
    query = query.lt("created_at", input.cursor)
  }

  const { data, error } = await query

  if (error) {
    throw new Error("Failed to load reports")
  }

  const rows = data ?? []
  const hasMore = rows.length > limit
  const items = rows.slice(0, limit).map((report) => ({
    id: report.id,
    targetType: report.target_type,
    targetId: report.target_id,
    reporterUserId: report.reporter_user_id,
    reason: report.reason,
    status: report.status,
    createdAt: report.created_at,
  }))

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1]?.createdAt ?? null : null,
  }
}