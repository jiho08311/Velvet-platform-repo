import {
  resolvePayoutRequestLifecycleState,
  type PayoutRequestLifecycleState,
} from "@/modules/payout/lib/resolve-payout-state"

export type PayoutRequestRow = {
  id: string
  creator_id: string
  amount: number
  currency: string
  status: string
  created_at: string
  approved_at?: string | null
  rejected_at?: string | null
}

export type PayoutRequestReadModel = {
  id: string
  creatorId: string
  amount: number
  currency: string
  status: string
  lifecycleState: PayoutRequestLifecycleState
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
}

export function buildPayoutRequestReadModel(
  row: PayoutRequestRow
): PayoutRequestReadModel {
  return {
    id: row.id,
    creatorId: row.creator_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    lifecycleState: resolvePayoutRequestLifecycleState({
      payoutRequestStatus: row.status,
    }).state,
    createdAt: row.created_at,
    approvedAt: row.approved_at ?? null,
    rejectedAt: row.rejected_at ?? null,
  }
}
