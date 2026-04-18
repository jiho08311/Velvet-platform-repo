import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { requireUser } from "@/modules/auth/server/require-user"
import {
  resolvePayoutExecutionLifecycleState,
  type PayoutExecutionLifecycleState,
} from "@/modules/payout/lib/resolve-payout-state"

type CreatorPayoutHistoryRow = {
  id: string
  amount: number | null
  currency: string | null
  status: "pending" | "processing" | "paid" | "failed"
  paid_at: string | null
  failure_reason: string | null
  created_at: string
}

export type CreatorPayoutHistoryItem = {
  id: string
  amount: number
  currency: string
  status: "pending" | "processing" | "paid" | "failed"
  lifecycleState: PayoutExecutionLifecycleState
  paidAt: string | null
  failureReason: string | null
  createdAt: string
}

export async function getCreatorPayoutHistory(): Promise<
  CreatorPayoutHistoryItem[]
> {
  const user = await requireUser()

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (creatorError || !creator) {
    throw new Error("Creator not found")
  }

  const { data: payouts, error: payoutsError } = await supabaseAdmin
    .from("payouts")
    .select(
      "id, amount, currency, status, paid_at, failure_reason, created_at"
    )
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<CreatorPayoutHistoryRow[]>()

  if (payoutsError) {
    throw payoutsError
  }

  return (payouts ?? []).map((row) => ({
    id: row.id,
    amount: row.amount ?? 0,
    currency: row.currency ?? "KRW",
    status: row.status,
    lifecycleState: resolvePayoutExecutionLifecycleState({
      payoutStatus: row.status,
    }),
    paidAt: row.paid_at,
    failureReason: row.failure_reason,
    createdAt: row.created_at,
  }))
}