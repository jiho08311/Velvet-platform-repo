import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { resolveSubscriptionState } from "@/modules/subscription/lib/resolve-subscription-state"

type IsSubscribedInput = {
  userId: string
  creatorId: string
}

type SubscriptionRow = {
  id: string
  status: "active" | "canceled" | "expired" | "incomplete"
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  canceled_at: string | null
  created_at: string
}

export async function isSubscribed({
  userId,
  creatorId,
}: IsSubscribedInput): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, status, current_period_end, cancel_at_period_end, canceled_at, created_at"
    )
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<SubscriptionRow[]>()

  if (error) {
    throw error
  }

  const row = data?.[0]

  if (!row) {
    return false
  }

  const resolved = resolveSubscriptionState({
    status: row.status,
    currentPeriodEndAt: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    canceledAt: row.canceled_at,
  })

  return resolved.hasAccess
}