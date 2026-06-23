import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type LedgerPlatformRevenueRow = {
  platform_revenue_credit: number | null
  platform_revenue_debit: number | null
  creator_receivable_credit: number | null
  creator_receivable_debit: number | null
  cash_credit: number | null
}

export async function getLedgerPlatformRevenueRow(): Promise<LedgerPlatformRevenueRow> {
  const { data, error } = await supabaseAdmin.rpc(
    "get_ledger_platform_revenue"
  )

  if (error) {
    throw error
  }

  return data?.[0] ?? {
    platform_revenue_credit: 0,
    platform_revenue_debit: 0,
    creator_receivable_credit: 0,
    creator_receivable_debit: 0,
    cash_credit: 0,
  }
}