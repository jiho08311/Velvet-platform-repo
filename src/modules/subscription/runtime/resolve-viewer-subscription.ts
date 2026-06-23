import { findLatestViewerSubscriptionByUserAndCreator } from "@/modules/subscription/repositories/subscription-read-repository"
import { synchronizeCanonicalEntitlementEventNoThrow } from "@/modules/subscription/traceability"
import type { ViewerSubscriptionStatus } from "@/modules/subscription/contracts/viewer-subscription-contract"
import {
  findLatestSubscriptionReadModel,
  toSubscriptionDisplayStatus,
  type SubscriptionReadModelRow,
} from "@/modules/subscription/mappers/build-subscription-read-model"

export type { ViewerSubscriptionStatus } from "@/modules/subscription/contracts/viewer-subscription-contract"
type SubscriptionRow = SubscriptionReadModelRow

export async function resolveViewerSubscription(
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
    await synchronizeCanonicalEntitlementEventNoThrow({
      subjectUserId: viewerId,
      issuerCreatorId: creator,
      lifecycleState: "absent",
      hasAccess: false,
      sourceTable: "subscriptions",
      eventMetadata: {
        runtimeSurface: "getViewerSubscription",
        runtimeResult: "subscription_absent",
      },
    })

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
    await synchronizeCanonicalEntitlementEventNoThrow({
      subjectUserId: viewerId,
      issuerCreatorId: creator,
      lifecycleState: "invalid",
      hasAccess: false,
      subscriptionId: row.id,
      sourceTable: "subscriptions",
      sourceRowId: row.id,
      eventMetadata: {
        runtimeSurface: "getViewerSubscription",
        runtimeResult: "subscription_read_model_absent",
      },
    })

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
  const result = {
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

  await synchronizeCanonicalEntitlementEventNoThrow({
    subjectUserId: readModel.userId,
    issuerCreatorId: readModel.creatorId,
    lifecycleState: resolvedStatus,
    hasAccess: readModel.hasAccess,
    subscriptionId: readModel.id,
    sourceTable: "subscriptions",
    sourceRowId: readModel.id,
    orderingTimestamp: row.updated_at ?? row.created_at,
    eventMetadata: {
      runtimeSurface: "getViewerSubscription",
      runtimeResult: "subscription_read_model_observed",
      cancelAtPeriodEnd: readModel.cancelAtPeriodEnd,
      currentPeriodEndAt: readModel.currentPeriodEndAt,
    },
  })

  return result
}
