import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type SucceededPaymentReconciliationRow = {
  id: string
  amount: number
  currency: string
  status: "succeeded"
}

export type RefundedPaymentReconciliationRow = {
  id: string
  amount: number
  currency: string
  status: "refunded"
}

export type PaidPayoutReconciliationRow = {
  id: string
  amount: number
  currency: string
  status: "paid"
}

export type ReversedEarningReconciliationRow = {
  id: string
  payment_id: string
  status: string
  reversed_at: string | null
}

export async function listSucceededPaymentsForReconciliation(
  limit: number
): Promise<SucceededPaymentReconciliationRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select("id, amount, currency, status")
    .eq("status", "succeeded")
    .limit(limit)
    .returns<SucceededPaymentReconciliationRow[]>()

  if (error) throw error

  return data ?? []
}

export async function listRefundedPaymentsForReconciliation(
  limit: number
): Promise<RefundedPaymentReconciliationRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select("id, amount, currency, status")
    .eq("status", "refunded")
    .limit(limit)
    .returns<RefundedPaymentReconciliationRow[]>()

  if (error) throw error

  return data ?? []
}

export async function listPaidPayoutsForReconciliation(
  limit: number
): Promise<PaidPayoutReconciliationRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payout_state")
    .select("id, amount, currency, status")
    .eq("status", "paid")
    .limit(limit)
    .returns<PaidPayoutReconciliationRow[]>()

  if (error) throw error

  return data ?? []
}

export async function listReversedEarningsForReconciliation(
  limit: number
): Promise<ReversedEarningReconciliationRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .select("id, payment_id, status, reversed_at")
    .not("reversed_at", "is", null)
    .limit(limit)
    .returns<ReversedEarningReconciliationRow[]>()

  if (error) throw error

  return data ?? []
}

export async function hasLedgerTransaction(input: {
  transactionType: string
  paymentId?: string | null
  payoutId?: string | null
}): Promise<boolean> {
  let query = supabaseAdmin
    .from("ledger_transactions")
    .select("id", { count: "exact", head: true })
    .eq("transaction_type", input.transactionType)

  if (input.paymentId) {
    query = query.eq("payment_id", input.paymentId)
  }

  if (input.payoutId) {
    query = query.eq("payout_id", input.payoutId)
  }

  const { count, error } = await query

  if (error) throw error

  return (count ?? 0) > 0
}

export async function countLedgerTransactions(input: {
  transactionType: string
  paymentId?: string | null
  payoutId?: string | null
}): Promise<number> {
  let query = supabaseAdmin
    .from("ledger_transactions")
    .select("id", { count: "exact", head: true })
    .eq("transaction_type", input.transactionType)

  if (input.paymentId) {
    query = query.eq("payment_id", input.paymentId)
  }

  if (input.payoutId) {
    query = query.eq("payout_id", input.payoutId)
  }

  const { count, error } = await query

  if (error) throw error

  return count ?? 0
}

export async function hasRefundedPaymentForEarning(
  paymentId: string
): Promise<boolean> {
  const { count, error } = await supabaseAdmin
    .from("canonical_payment_state")
    .select("id", { count: "exact", head: true })
    .eq("id", paymentId)
    .eq("status", "refunded")

  if (error) throw error

  return (count ?? 0) > 0
}

export async function insertFinancialReconciliationReport(input: {
  reportType: string
  checkedPayments: number
  checkedPayouts: number
  checkedEarnings: number
  mismatchCount: number
  status: "ok" | "mismatch"
  metadata: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("financial_reconciliation_reports")
    .insert({
      report_type: input.reportType,
      checked_payments: input.checkedPayments,
      checked_payouts: input.checkedPayouts,
      checked_earnings: input.checkedEarnings,
      mismatch_count: input.mismatchCount,
      status: input.status,
      metadata: input.metadata,
      created_at: new Date().toISOString(),
    })

  if (error) throw error
}