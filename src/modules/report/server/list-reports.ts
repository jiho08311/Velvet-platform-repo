import { requireAdmin } from "@/modules/admin/server/require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ListReportsParams = {
  limit?: number
}

export async function listReports(params: ListReportsParams = {}) {
  await requireAdmin()

  const limit = Math.min(params.limit ?? 50, 100)

  const { data, error } = await supabaseAdmin
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

  if (error) {
    throw error
  }

  return data ?? []
}