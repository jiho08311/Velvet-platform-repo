import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type LedgerCreatorBalanceRow = {
  creator_id: string | null
  currency: string | null
  receivable_credit: number | null
  receivable_debit: number | null
  payable_credit: number | null
  payable_debit: number | null
  cash_credit: number | null
  cash_debit: number | null
}

export async function getLedgerCreatorBalanceRow(
  creatorId: string
): Promise<LedgerCreatorBalanceRow | null> {
  const { data, error } = await supabaseAdmin.rpc(
    "get_ledger_creator_balance",
    {
      p_creator_id: creatorId,
    }
  )

  if (error) {
    throw error
  }

  return data?.[0] ?? null
}