import { getViewerSubscription } from "@/modules/subscription/server/get-viewer-subscription"

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

  return viewerSubscription.isActive
}
