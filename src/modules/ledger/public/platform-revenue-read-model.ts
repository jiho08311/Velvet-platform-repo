import {
  getLedgerPlatformRevenueRow as getLedgerPlatformRevenueRowRepository,
} from "@/modules/ledger/repositories/ledger-revenue-repository"

export const PUBLIC_CONTRACT = true

export type LedgerPlatformRevenueRow = Awaited<
  ReturnType<typeof getLedgerPlatformRevenueRowRepository>
>

export async function getLedgerPlatformRevenueRow(): Promise<LedgerPlatformRevenueRow> {
  return getLedgerPlatformRevenueRowRepository()
}
