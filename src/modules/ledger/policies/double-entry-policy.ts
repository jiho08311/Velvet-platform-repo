import type { LedgerEntryInput } from "@/modules/ledger/types"

export function assertDoubleEntryBalanced(entries: LedgerEntryInput[]): void {
  if (entries.length < 2) {
    throw new Error("LEDGER_TRANSACTION_REQUIRES_AT_LEAST_TWO_ENTRIES")
  }

  const debitTotal = entries
    .filter((entry) => entry.direction === "debit")
    .reduce((sum, entry) => sum + entry.amount, 0)

  const creditTotal = entries
    .filter((entry) => entry.direction === "credit")
    .reduce((sum, entry) => sum + entry.amount, 0)

  if (debitTotal !== creditTotal) {
    throw new Error(
      `LEDGER_DOUBLE_ENTRY_IMBALANCE debit=${debitTotal} credit=${creditTotal}`
    )
  }

  for (const entry of entries) {
    if (!Number.isInteger(entry.amount) || entry.amount <= 0) {
      throw new Error("LEDGER_ENTRY_AMOUNT_MUST_BE_POSITIVE_INTEGER")
    }
  }
}