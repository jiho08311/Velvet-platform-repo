import {
  resolvePlatformRevenueSummary,
} from "@/modules/payout/services/platform-revenue-summary-service"
import type { PlatformRevenueSummary } from "@/modules/payout/types"

export const PUBLIC_CONTRACT = true

export async function getPlatformRevenueSummary(): Promise<PlatformRevenueSummary> {
  return resolvePlatformRevenueSummary()
}
