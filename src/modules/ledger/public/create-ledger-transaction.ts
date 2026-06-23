import {
  createLedgerTransaction as createLedgerTransactionService,
} from "@/modules/ledger/services/ledger-transaction-service"

export const PUBLIC_CONTRACT = true

export type CreateLedgerTransactionInput = Parameters<
  typeof createLedgerTransactionService
>[0]
export type LedgerTransaction = Awaited<
  ReturnType<typeof createLedgerTransactionService>
>

export async function createLedgerTransaction(
  input: CreateLedgerTransactionInput
): Promise<LedgerTransaction> {
  return createLedgerTransactionService(input)
}
