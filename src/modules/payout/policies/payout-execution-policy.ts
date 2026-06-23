import {
  resolvePayoutExecutionLifecycleState,
  type PayoutExecutionLifecycleState,
  type PayoutStatus,
} from "@/modules/payout/policies/resolve-payout-state"

type PayoutExecutionProjectionInput = {
  id: string
  amount?: number | null
  currency?: string | null
  status?: PayoutStatus | null
  createdAt: string
  paidAt?: string | null
  failureReason?: string | null
}

export type PayoutExecutionProjection = {
  id: string
  amount: number
  currency: string
  status: "pending" | "processing" | "paid" | "failed"
  lifecycleState: PayoutExecutionLifecycleState
  createdAt: string
  paidAt: string | null
  failureReason: string | null
}

export function resolvePayoutExecutionProjection(
  input: PayoutExecutionProjectionInput
): PayoutExecutionProjection {
  const status = (input.status ?? "pending") as
    | "pending"
    | "processing"
    | "paid"
    | "failed"

  return {
    id: input.id,
    amount: input.amount ?? 0,
    currency: input.currency ?? "KRW",
    status,
    lifecycleState: resolvePayoutExecutionLifecycleState({
      payoutStatus: status,
    }),
    createdAt: input.createdAt,
    paidAt: input.paidAt ?? null,
    failureReason: input.failureReason ?? null,
  }
}