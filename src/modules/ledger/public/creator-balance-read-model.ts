import {
  getLedgerCreatorBalanceRow as getLedgerCreatorBalanceRowRepository,
} from "@/modules/ledger/repositories/ledger-balance-repository"

export const PUBLIC_CONTRACT = true

export type LedgerCreatorBalanceRow = NonNullable<
  Awaited<ReturnType<typeof getLedgerCreatorBalanceRowRepository>>
>

export async function getLedgerCreatorBalanceRow(
  creatorId: string
): Promise<LedgerCreatorBalanceRow | null> {
  return getLedgerCreatorBalanceRowRepository(creatorId)
}
