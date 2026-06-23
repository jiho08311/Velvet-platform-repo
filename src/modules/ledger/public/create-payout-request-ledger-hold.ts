import {
  createPayoutRequestLedgerHold as createPayoutRequestLedgerHoldService,
} from "@/modules/ledger/services/payout-request-hold-service"

export const PUBLIC_CONTRACT = true

export type CreatePayoutRequestLedgerHoldInput = Parameters<
  typeof createPayoutRequestLedgerHoldService
>[0]
export type CreatePayoutRequestLedgerHoldResult = Awaited<
  ReturnType<typeof createPayoutRequestLedgerHoldService>
>

export async function createPayoutRequestLedgerHold(
  input: CreatePayoutRequestLedgerHoldInput
): Promise<CreatePayoutRequestLedgerHoldResult> {
  return createPayoutRequestLedgerHoldService(input)
}
