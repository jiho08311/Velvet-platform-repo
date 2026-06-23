import {
  createLedgerHold as createLedgerHoldService,
} from "@/modules/ledger/services/ledger-hold-service"

export const PUBLIC_CONTRACT = true

export type CreateLedgerHoldInput = Parameters<typeof createLedgerHoldService>[0]
export type LedgerHold = Awaited<ReturnType<typeof createLedgerHoldService>>

export async function createLedgerHold(
  input: CreateLedgerHoldInput
): Promise<LedgerHold> {
  return createLedgerHoldService(input)
}
