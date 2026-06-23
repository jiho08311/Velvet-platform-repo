import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type {
  CreateLedgerHoldInput,
  LedgerHoldRow,
} from "@/modules/ledger/types"

export async function insertLedgerHold({
  creatorId,
  sourceTransactionId,
  amount,
  currency,
  holdType,
}: CreateLedgerHoldInput): Promise<LedgerHoldRow> {
  const { data, error } = await supabaseAdmin
    .from("ledger_holds")
    .insert({
      creator_id: creatorId,
      source_transaction_id: sourceTransactionId,
      amount,
      currency,
      hold_type: holdType,
      status: "active",
    })
    .select(
      "id, creator_id, source_transaction_id, amount, currency, hold_type, status, expires_at, released_at, created_at"
    )
    .single<LedgerHoldRow>()

  if (error || !data) {
    throw error ?? new Error("FAILED_TO_CREATE_LEDGER_HOLD")
  }

  return data
}