import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type {
  CreateLedgerTransactionInput,
  LedgerTransactionRow,
} from "@/modules/ledger/types"

export async function insertLedgerTransactionWithEntries(
  input: CreateLedgerTransactionInput
): Promise<LedgerTransactionRow> {
  const { data, error } = await supabaseAdmin
    .rpc("create_ledger_transaction_with_entries", {
      p_transaction_type: input.transactionType,
      p_payment_id: input.paymentId ?? null,
      p_payout_id: input.payoutId ?? null,
      p_payout_request_id: input.payoutRequestId ?? null,
      p_creator_id: input.creatorId ?? null,
      p_amount: input.amount,
      p_currency: input.currency,
      p_reference_transaction_id: input.referenceTransactionId ?? null,
      p_occurred_at: input.occurredAt,
      p_entries: input.entries.map((entry) => ({
        account_code: entry.accountCode,
        entry_type: entry.entryType,
        direction: entry.direction,
        amount: entry.amount,
        currency: entry.currency,
        creator_id: entry.creatorId ?? null,
        payment_id: entry.paymentId ?? null,
        payout_id: entry.payoutId ?? null,
        payout_request_id: entry.payoutRequestId ?? null,
      })),
    })
    .single<LedgerTransactionRow>()

  if (error) {
    throw error
  }

  return data
}