import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import {
  resolvePayoutExecutionLifecycleState,
  type PayoutExecutionLifecycleState,
} from "@/modules/payout/lib/resolve-payout-state"

type ListCreatorPayoutsParams = {
  creatorId: string
}

type CreatorPayoutRow = {
  id: string
  amount: number | null
  currency: string | null
  status: "pending" | "processing" | "paid" | "failed"
  created_at: string
  paid_at: string | null
  failure_reason: string | null
}

export type CreatorPayout = {
  id: string
  amount: number
  currency: string
  status: "pending" | "processing" | "paid" | "failed"
  lifecycleState: PayoutExecutionLifecycleState
  createdAt: string
  paidAt: string | null
  failureReason: string | null
}

export async function listCreatorPayouts({
  creatorId,
}: ListCreatorPayoutsParams): Promise<CreatorPayout[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("payouts")
    .select(
      "id, amount, currency, status, created_at, paid_at, failure_reason"
    )
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .returns<CreatorPayoutRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    amount: row.amount ?? 0,
    currency: row.currency ?? "KRW",
    status: row.status,
    lifecycleState: resolvePayoutExecutionLifecycleState({
      payoutStatus: row.status,
    }),
    createdAt: row.created_at,
    paidAt: row.paid_at,
    failureReason: row.failure_reason,
  }))
}