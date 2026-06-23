import { getViewerSubscription } from "@/modules/subscription/runtime/get-viewer-subscription"
import type { SubscriptionValidationResult } from "@/modules/subscription/contracts/viewer-subscription-contract"
import {
  synchronizeFinancialIdentityCorrelationNoThrow,
  synchronizeSubscriptionValidationBoundaryNoThrow,
} from "@/modules/subscription/traceability"

type CheckSubscriptionInput = {
  userId: string
  creatorId: string
}

export async function checkSubscription({
  userId,
  creatorId,
}: CheckSubscriptionInput): Promise<boolean> {
  const resolvedUserId = userId.trim()
  const resolvedCreatorId = creatorId.trim()

  if (!resolvedUserId || !resolvedCreatorId) {
    return false
  }

  const viewerSubscription = await getViewerSubscription(
    resolvedUserId,
    resolvedCreatorId
  )

  const validationResult: SubscriptionValidationResult = {
    userId: resolvedUserId,
    creatorId: resolvedCreatorId,
    isActive: viewerSubscription.isActive,
    subscriptionId: viewerSubscription.subscription?.id ?? null,
  }

  await synchronizeSubscriptionValidationBoundaryNoThrow({
    subjectUserId: validationResult.userId,
    creatorId: validationResult.creatorId,
    accessGranted: validationResult.isActive,
    validationResult: validationResult.isActive ? "active" : "inactive",
    subscriptionId: validationResult.subscriptionId,
    sourceTable: "subscriptions",
    sourceRowId: validationResult.subscriptionId,
    eventMetadata: {
      runtimeSurface: "checkSubscription",
      runtimeResult: validationResult.isActive ? "active" : "inactive",
      subscriptionStatus: viewerSubscription.subscription?.status ?? null,
    },
  })

  await synchronizeFinancialIdentityCorrelationNoThrow({
    userId: validationResult.userId,
    creatorId: validationResult.creatorId,
    ownerUserId: validationResult.userId,
    financialActorKey: validationResult.userId,
    actorKind: "subscriber",
    ownershipSurface: "subscription_ownership",
    sourceTable: "subscriptions",
    sourceRowId: validationResult.subscriptionId,
    targetTable: "subscriptions",
    targetRowId: validationResult.subscriptionId,
    relatedSubscriptionId: validationResult.subscriptionId,
    identityMetadata: {
      runtimeSurface: "checkSubscription",
      runtimeIdentityAuthorityPreserved: true,
    },
    correlationMetadata: {
      runtimeResult: validationResult.isActive ? "active" : "inactive",
      subscriptionStatus: viewerSubscription.subscription?.status ?? null,
    },
  })

  return validationResult.isActive
}
