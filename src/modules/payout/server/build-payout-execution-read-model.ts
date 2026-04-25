import { resolvePayoutExecutionProjection } from "@/modules/payout/lib/resolve-payout-execution-projection"
import type { PayoutExecutionLifecycleState } from "@/modules/payout/lib/resolve-payout-state"

export type PayoutExecutionStatus = "pending" | "processing" | "paid" | "failed"

export type PayoutExecutionRow = {
  id: string
  amount: number | null
  currency?: string | null
  status: PayoutExecutionStatus
  created_at: string
  paid_at?: string | null
  failure_reason?: string | null
}

export type PayoutExecutionReadModel = {
  id: string
  amount: number
  currency: string
  status: PayoutExecutionStatus
  lifecycleState: PayoutExecutionLifecycleState
  createdAt: string
  paidAt: string | null
  failureReason: string | null
}

export function buildPayoutExecutionReadModel(
  row: PayoutExecutionRow
): PayoutExecutionReadModel {
  const projection = resolvePayoutExecutionProjection({
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    failureReason: row.failure_reason,
  })

  return {
    id: projection.id,
    amount: projection.amount,
    currency: projection.currency,
    status: projection.status,
    lifecycleState: projection.lifecycleState,
    createdAt: projection.createdAt,
    paidAt: projection.paidAt,
    failureReason: projection.failureReason,
  }
}
