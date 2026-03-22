import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ReportRow = {
  id: string
  user_id: string
  target_id: string
  type: string
  reason: string
  created_at: string
}

export type Report = {
  id: string
  userId: string
  targetId: string
  type: string
  reason: string
  createdAt: string
}

export async function listReports(): Promise<Report[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("reports")
    .select("id, user_id, target_id, type, reason, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: ReportRow) => ({
    id: row.id,
    userId: row.user_id,
    targetId: row.target_id,
    type: row.type,
    reason: row.reason,
    createdAt: row.created_at,
  }))
}