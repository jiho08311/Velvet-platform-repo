import {
  createPaymentConfirmedLedgerTransaction as createPaymentConfirmedLedgerTransactionService,
} from "@/modules/ledger/services/payment-to-ledger-service"

export const PUBLIC_CONTRACT = true

export type CreatePaymentConfirmedLedgerTransactionInput = Parameters<
  typeof createPaymentConfirmedLedgerTransactionService
>[0]
export type CreatePaymentConfirmedLedgerTransactionResult = Awaited<
  ReturnType<typeof createPaymentConfirmedLedgerTransactionService>
>

export async function createPaymentConfirmedLedgerTransaction(
  input: CreatePaymentConfirmedLedgerTransactionInput
): Promise<CreatePaymentConfirmedLedgerTransactionResult> {
  return createPaymentConfirmedLedgerTransactionService(input)
}
