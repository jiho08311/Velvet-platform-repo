import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type LedgerCreatorAnalyticsAmountRow = {
  amount: number | string | null
}

export type LedgerCreatorAnalyticsPaymentRow =
  LedgerCreatorAnalyticsAmountRow & {
    id: string
    type: string | null
    created_at: string | null
  }

export type LedgerCreatorDashboardPaymentRow = {
  amount: number | string | null
  created_at?: string | null
  currency: string | null
}

export async function listLedgerCreatorAnalyticsTotalPaymentRows(
  creatorId: string
): Promise<LedgerCreatorAnalyticsAmountRow[]> {
  const { data, error } = await supabaseAdmin
    .from("ledger_transactions")
    .select("amount")
    .eq("transaction_type", "payment_confirmed")
    .eq("creator_id", creatorId)
    .returns<LedgerCreatorAnalyticsAmountRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function listLedgerCreatorAnalyticsMonthlyPaymentRows({
  creatorId,
  periodStart,
}: {
  creatorId: string
  periodStart: string
}): Promise<LedgerCreatorAnalyticsPaymentRow[]> {
  const { data, error } = await supabaseAdmin
    .from("ledger_transactions")
    .select("id, amount, transaction_type, created_at")
    .eq("transaction_type", "payment_confirmed")
    .eq("creator_id", creatorId)
    .gte("created_at", periodStart)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    amount: row.amount,
    type: row.transaction_type,
    created_at: row.created_at,
  }))
}

export async function listLedgerCreatorDashboardPaymentRows({
  creatorId,
  monthStart,
}: {
  creatorId: string
  monthStart: string
}): Promise<{
  monthlyPayments: LedgerCreatorDashboardPaymentRow[]
  totalPayments: LedgerCreatorDashboardPaymentRow[]
}> {
  const [monthlyResult, totalResult] = await Promise.all([
    supabaseAdmin
      .from("ledger_transactions")
      .select("amount, currency, created_at")
      .eq("transaction_type", "payment_confirmed")
      .eq("creator_id", creatorId)
      .gte("created_at", monthStart)
      .returns<LedgerCreatorDashboardPaymentRow[]>(),

    supabaseAdmin
      .from("ledger_transactions")
      .select("amount, currency")
      .eq("transaction_type", "payment_confirmed")
      .eq("creator_id", creatorId)
      .returns<LedgerCreatorDashboardPaymentRow[]>(),
  ])

  if (monthlyResult.error) {
    throw monthlyResult.error
  }

  if (totalResult.error) {
    throw totalResult.error
  }

  return {
    monthlyPayments: monthlyResult.data ?? [],
    totalPayments: totalResult.data ?? [],
  }
}