import { resolveLedgerPlatformRevenueSummary } from "@/modules/ledger/public/ledger-revenue-policy"
import { getLedgerPlatformRevenueRow } from "@/modules/ledger/public/platform-revenue-read-model"
import type { PlatformRevenueSummary } from "@/modules/payout/types"

export async function resolvePlatformRevenueSummary(): Promise<PlatformRevenueSummary> {
  const row = await getLedgerPlatformRevenueRow()

  return resolveLedgerPlatformRevenueSummary(row)
}
