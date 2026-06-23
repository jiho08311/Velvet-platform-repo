import {
  createPayoutPaidLedgerTransaction as createPayoutPaidLedgerTransactionService,
} from "@/modules/ledger/services/payout-paid-ledger-service"

export const PUBLIC_CONTRACT = true

export type CreatePayoutPaidLedgerTransactionInput = Parameters<
  typeof createPayoutPaidLedgerTransactionService
>[0]
export type CreatePayoutPaidLedgerTransactionResult = Awaited<
  ReturnType<typeof createPayoutPaidLedgerTransactionService>
>

export async function createPayoutPaidLedgerTransaction(
  input: CreatePayoutPaidLedgerTransactionInput
): Promise<CreatePayoutPaidLedgerTransactionResult> {
  return createPayoutPaidLedgerTransactionService(input)
}
