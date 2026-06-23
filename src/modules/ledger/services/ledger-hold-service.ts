import { getLedgerCreatorBalanceRow } from "@/modules/ledger/repositories/ledger-balance-repository"
import { insertLedgerHold } from "@/modules/ledger/repositories/ledger-hold-repository"
import { resolveLedgerCreatorBalanceTotals } from "@/modules/ledger/policies/ledger-balance-policy"
import type {
  CreateLedgerHoldInput,
  LedgerHoldRow,
} from "@/modules/ledger/types"

export async function createLedgerHold(
  input: CreateLedgerHoldInput
): Promise<LedgerHoldRow> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("LEDGER_HOLD_AMOUNT_INVALID")
  }

  const balanceRow = await getLedgerCreatorBalanceRow(input.creatorId)
  const balance = resolveLedgerCreatorBalanceTotals(balanceRow)

  if (input.amount > balance.requestableAmount) {
    throw new Error("LEDGER_HOLD_INSUFFICIENT_AVAILABLE_BALANCE")
  }

  return insertLedgerHold(input)
}