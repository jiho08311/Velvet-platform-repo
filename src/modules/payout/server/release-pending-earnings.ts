import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { markEarningAsAvailable } from "./mark-earning-as-available"

type ReleasePendingEarningsInput = {
  holdDays?: number
  limit?: number
}

type PendingEarningRow = {
  id: string
  created_at: string
  available_at: string | null
}

type ReleasePendingEarningsResult = {
  processedCount: number
  earningIds: string[]
}

export async function releasePendingEarnings({
  holdDays = 7,
  limit = 100,
}: ReleasePendingEarningsInput = {}): Promise<ReleasePendingEarningsResult> {
  const safeHoldDays = Math.max(0, holdDays)
  const safeLimit = Math.max(1, Math.min(limit, 500))

  const threshold = new Date(
    Date.now() - safeHoldDays * 24 * 60 * 60 * 1000
  ).toISOString()

  const { data, error } = await supabaseAdmin
    .from("earnings")
    .select("id, created_at, available_at")
    .eq("status", "pending")
    .not("available_at", "is", null)
    .lte("available_at", new Date().toISOString())
    .order("available_at", { ascending: true })
    .limit(safeLimit)
    .returns<PendingEarningRow[]>()

  if (error) {
    throw error
  }

  const rows = (data ?? []).filter((row) => {
    if (row.available_at) {
      return true
    }

    return row.created_at <= threshold
  })

  const earningIds: string[] = []

  for (const row of rows) {
    const updated = await markEarningAsAvailable({
      earningId: row.id,
    })

    if (updated) {
      earningIds.push(updated.id)
    }
  }

  return {
    processedCount: earningIds.length,
    earningIds,
  }
}