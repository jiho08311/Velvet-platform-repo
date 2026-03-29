import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type ViewerSubscriptionStatus = {
  isActive: boolean
  subscription: {
    id: string
    viewerUserId: string
    creatorId: string
    currentPeriodEndAt: string | null
    cancelAtPeriodEnd: boolean
    status: "active" | "canceled" | "expired"
  } | null
}

type SubscriptionRow = {
  id: string
  user_id: string
  creator_id: string
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  status: "active" | "canceled" | "expired"
  created_at: string
}

export async function getViewerSubscription(
  viewerUserId: string,
  creatorId: string
): Promise<ViewerSubscriptionStatus> {
  const viewerId = viewerUserId.trim()
  const creator = creatorId.trim()

  if (!viewerId || !creator) {
    return {
      isActive: false,
      subscription: null,
    }
  }

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, creator_id, current_period_end, cancel_at_period_end, status, created_at"
    )
    .eq("user_id", viewerId)
    .eq("creator_id", creator)
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<SubscriptionRow[]>()

  if (error) {
    throw error
  }

  const row = data?.[0]

  if (!row) {
    return {
      isActive: false,
      subscription: null,
    }
  }

  const isExpiredByDate =
    row.current_period_end !== null &&
    new Date(row.current_period_end).getTime() <= Date.now()

  const resolvedStatus =
    row.status === "active" && isExpiredByDate ? "expired" : row.status

  return {
    isActive: resolvedStatus === "active",
    subscription: {
      id: row.id,
      viewerUserId: row.user_id,
      creatorId: row.creator_id,
      currentPeriodEndAt: row.current_period_end,
      cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
      status: resolvedStatus,
    },
  }
}