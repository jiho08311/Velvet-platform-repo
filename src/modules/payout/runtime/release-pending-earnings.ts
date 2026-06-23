import type { AuditCorrelationContext } from "@/shared/observability/audit-event-types"
import { releasePendingEarningRows } from "@/modules/payout/services/earning-release-service"

type ReleasePendingEarningsInput = {
  holdDays?: number
  limit?: number
  correlation?: AuditCorrelationContext
}

type ReleasePendingEarningsResult = {
  processedCount: number
  earningIds: string[]
}

export async function releasePendingEarnings({
  holdDays = 7,
  limit = 100,
  correlation,
}: ReleasePendingEarningsInput = {}): Promise<ReleasePendingEarningsResult> {
  return releasePendingEarningRows({ holdDays, limit, correlation })
}