import {
  resolvePayoutExecutionLifecycleState,
  type PayoutExecutionLifecycleState,
} from "@/modules/payout/lib/resolve-payout-state"

type PayoutProjectionStatus = "pending" | "processing" | "paid" | "failed"

type PayoutExecutionProjectionInput = {
  id: string
  amount?: number | null
  currency?: string | null
  status?: PayoutProjectionStatus | null
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
  const status: PayoutProjectionStatus = input.status ?? "pending"

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