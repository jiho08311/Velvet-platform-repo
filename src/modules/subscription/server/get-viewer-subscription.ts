import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type ViewerSubscriptionStatus = {
  isActive: boolean
  subscription: {
    id: string
    viewerUserId: string
    creatorId: string
    currentPeriodEndAt: string | null
    status: "active" | "canceled" | "expired"
  } | null
}

type SubscriptionRow = {
  id: string
  user_id: string
  creator_id: string
  current_period_end: string | null
  status: "active" | "canceled" | "expired"
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
    .select("id, user_id, creator_id, current_period_end, status")
    .eq("user_id", viewerId)
    .eq("creator_id", creator)
    .maybeSingle<SubscriptionRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return {
      isActive: false,
      subscription: null,
    }
  }

  const isActive = data.status === "active"

  return {
    isActive,
    subscription: {
      id: data.id,
      viewerUserId: data.user_id,
      creatorId: data.creator_id,
      currentPeriodEndAt: data.current_period_end,
      status: data.status,
    },
  }
}