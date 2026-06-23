import { recordFinancialOperationAudit as createAuditLog } from "@/modules/governance/public/audit-contract"
import type { ReleasePendingEarningsResult } from "@/modules/payout/contracts/earning-release-contract"
import type { AuditCorrelationContext } from "@/shared/observability/audit-event-types"
import {
  isPendingEarningReleaseEligible,
  normalizeEarningReleaseHoldDays,
  normalizeEarningReleaseLimit,
  resolveEarningReleaseThreshold,
} from "@/modules/payout/policies/earning-release-policy"
import {
  listPendingEarningRowsReadyForRelease,
  type EarningRow,
} from "@/modules/payout/repositories/earning-read-repository"
import { markPendingEarningRowAsAvailable } from "@/modules/payout/repositories/earning-write-repository"
import { InfrastructureError } from "@/shared/errors"
export type { ReleasePendingEarningsResult } from "@/modules/payout/contracts/earning-release-contract"

export type ReleasePendingEarningsInput = {
  holdDays?: number
  limit?: number
  correlation?: AuditCorrelationContext
}

export async function markEarningAsAvailableForRelease({
  earningId,
}: {
  earningId: string
}): Promise<EarningRow | null> {
  const id = earningId.trim()

  if (!id) {
    throw new InfrastructureError("EARNING_RELEASE_EARNING_ID_REQUIRED")
  }

  return markPendingEarningRowAsAvailable({
    earningId: id,
    availableAt: new Date().toISOString(),
  })
}

export async function executeEarningRelease({
  holdDays = 7,
  limit = 100,
  correlation,
}: ReleasePendingEarningsInput = {}): Promise<ReleasePendingEarningsResult> {
  const safeHoldDays = normalizeEarningReleaseHoldDays(holdDays)
  const safeLimit = normalizeEarningReleaseLimit(limit)
  const threshold = resolveEarningReleaseThreshold(safeHoldDays)

  const data = await listPendingEarningRowsReadyForRelease({
    availableAtLte: new Date().toISOString(),
    limit: safeLimit,
  })

  const rows = data.filter((row) =>
    isPendingEarningReleaseEligible(row, threshold)
  )

  const earningIds: string[] = []

  for (const row of rows) {
    const updated = await markEarningAsAvailableForRelease({
      earningId: row.id,
    })

    if (updated) {
      earningIds.push(updated.id)
    }
  }

  if (earningIds.length > 0) {
    await createAuditLog({
      actorId: null,
      action: "earning_released",
      targetType: "earning",
      targetId: earningIds[0],
      metadata: {
        earningIds,
        processedCount: earningIds.length,
        holdDays: safeHoldDays,
        limit: safeLimit,
      },
      correlation,
    })
  }

  return {
    processedCount: earningIds.length,
    earningIds,
  }
}
