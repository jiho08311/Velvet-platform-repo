import { assertDoubleEntryBalanced } from "@/modules/ledger/policies/double-entry-policy"
import { insertLedgerTransactionWithEntries } from "@/modules/ledger/repositories/ledger-transaction-repository"
import type {
  CreateLedgerTransactionInput,
  LedgerTransactionRow,
} from "@/modules/ledger/types"

export async function createLedgerTransaction(
  input: CreateLedgerTransactionInput
): Promise<LedgerTransactionRow> {
  assertDoubleEntryBalanced(input.entries)

  return insertLedgerTransactionWithEntries(input)
}