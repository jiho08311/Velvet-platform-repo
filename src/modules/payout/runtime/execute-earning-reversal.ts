import { recordFinancialOperationAudit as createAuditLog } from "@/modules/governance/public/audit-contract"
import type { EarningReversalResult } from "@/modules/payout/contracts/earning-mutation-contract"
import { findEarningByPaymentId } from "@/modules/payout/repositories/earning-read-repository"
import { markEarningRowAsReversed } from "@/modules/payout/repositories/earning-write-repository"

type ExecuteEarningReversalInput = {
  paymentId: string
  reason?: string
}

export async function executeEarningReversal({
  paymentId,
}: ExecuteEarningReversalInput): Promise<EarningReversalResult> {
  const safePaymentId = paymentId.trim()

  if (!safePaymentId) {
    throw new Error("Invalid payment id")
  }

  const earning = await findEarningByPaymentId(safePaymentId)

  if (!earning) {
    return {
      status: "not_found",
      paymentId: safePaymentId,
      earningId: null,
    }
  }

  if (earning.status === "reversed") {
    return {
      status: "already_reversed",
      paymentId: safePaymentId,
      earningId: earning.id,
    }
  }

  if (earning.status === "paid_out") {
    return {
      status: "blocked_paid_out",
      paymentId: safePaymentId,
      earningId: earning.id,
    }
  }

  const reversedAt = new Date().toISOString()
  await markEarningRowAsReversed({
    earningId: earning.id,
    reversedAt,
  })

  await createAuditLog({
    actorId: null,
    action: "earning_reversed",
    targetType: "earning",
    targetId: earning.id,
    metadata: {
      paymentId: safePaymentId,
      previousStatus: earning.status,
      nextStatus: "reversed",
    },
  })

  return {
    status: "reversed",
    paymentId: safePaymentId,
    earningId: earning.id,
  }
}
