import {
  createChargebackLedgerAdjustment as createChargebackLedgerAdjustmentService,
} from "@/modules/ledger/services/chargeback-ledger-service"

export const PUBLIC_CONTRACT = true

export type CreateChargebackLedgerAdjustmentInput = Parameters<
  typeof createChargebackLedgerAdjustmentService
>[0]
export type CreateChargebackLedgerAdjustmentResult = Awaited<
  ReturnType<typeof createChargebackLedgerAdjustmentService>
>

export async function createChargebackLedgerAdjustment(
  input: CreateChargebackLedgerAdjustmentInput
): Promise<CreateChargebackLedgerAdjustmentResult> {
  return createChargebackLedgerAdjustmentService(input)
}
