import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type LedgerPaymentAnalyticsAmountRow = {
  amount: number | null
}

export async function listLedgerPaymentAnalyticsAmountRows(): Promise<
  LedgerPaymentAnalyticsAmountRow[]
> {
  const { data, error } = await supabaseAdmin
    .from("ledger_transactions")
    .select("amount")
    .eq("transaction_type", "payment_confirmed")
    .returns<LedgerPaymentAnalyticsAmountRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}