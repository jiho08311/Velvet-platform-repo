import {
  createRefundLedgerAdjustment as createRefundLedgerAdjustmentService,
} from "@/modules/ledger/services/refund-ledger-service"

export const PUBLIC_CONTRACT = true

export type CreateRefundLedgerAdjustmentInput = Parameters<
  typeof createRefundLedgerAdjustmentService
>[0]
export type CreateRefundLedgerAdjustmentResult = Awaited<
  ReturnType<typeof createRefundLedgerAdjustmentService>
>

export async function createRefundLedgerAdjustment(
  input: CreateRefundLedgerAdjustmentInput
): Promise<CreateRefundLedgerAdjustmentResult> {
  return createRefundLedgerAdjustmentService(input)
}
