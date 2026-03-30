import { requireAdmin } from "@/modules/admin/server/require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ListReportsParams = {
  limit?: number
  cursor?: string
}

export async function listReports(params: ListReportsParams = {}) {
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
    // 🔥 cursor 안전 처리
    const safeCursor = decodeURIComponent(params.cursor).replace(" ", "+")
    query = query.lt("created_at", safeCursor)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  const nextCursor =
    data && data.length === limit
      ? data[data.length - 1].created_at
      : null

  return {
    data: data ?? [],
    nextCursor,
  }
}