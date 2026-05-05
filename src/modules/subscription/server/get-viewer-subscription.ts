import { findLatestViewerSubscriptionByUserAndCreator } from "@/modules/subscription/repositories/subscription-read-repository"
import {
  findLatestSubscriptionReadModel,
  toSubscriptionDisplayStatus,
  type SubscriptionReadModelRow,
} from "@/modules/subscription/server/build-subscription-read-model"

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

type SubscriptionRow = SubscriptionReadModelRow

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

  const row = await findLatestViewerSubscriptionByUserAndCreator({
    userId: viewerId,
    creatorId: creator,
  })

  if (!row) {
    return {
      isActive: false,
      subscription: null,
    }
  }

  const readModel = findLatestSubscriptionReadModel([
    {
      ...row,
      current_period_start: row.current_period_start ?? null,
      current_period_end: row.current_period_end ?? null,
      cancel_at_period_end: row.cancel_at_period_end ?? false,
      canceled_at: row.canceled_at ?? null,
      updated_at: row.updated_at ?? row.created_at,
    },
  ])

  if (!readModel) {
    return {
      isActive: false,
      subscription: null,
    }
  }

  const resolvedStatus: "active" | "canceled" | "expired" =
    toSubscriptionDisplayStatus(readModel.state) === "expired"
      ? "expired"
      : toSubscriptionDisplayStatus(readModel.state) === "canceled"
        ? "canceled"
        : "active"

  return {
    isActive: readModel.hasAccess,
    subscription: {
      id: readModel.id,
      viewerUserId: readModel.userId,
      creatorId: readModel.creatorId,
      currentPeriodEndAt: readModel.currentPeriodEndAt,
      cancelAtPeriodEnd: readModel.cancelAtPeriodEnd,
      status: resolvedStatus,
    },
  }
}