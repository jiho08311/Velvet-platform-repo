import { buildSubscriptionReadModel } from "@/modules/subscription/public/build-subscription-read-model"
import { countAllActiveSubscriptions } from "@/modules/subscription/public/count-subscriptions"
import { getCreatorSubscribers } from "@/modules/subscription/public/get-creator-subscribers"
import { listUserSubscriptionReadModelRows } from "@/modules/subscription/public/list-user-subscription-read-model-rows"
import { listUserSubscriptions } from "@/modules/subscription/public/list-user-subscriptions"

export async function listCanonicalAccessibleSubscriptionCreatorIds(
  viewerUserId: string
) {
  const rows = await listUserSubscriptionReadModelRows(viewerUserId)

  return (rows ?? [])
    .filter((row) => buildSubscriptionReadModel(row).hasAccess)
    .map((row) => row.creator_id)
}

export async function countCanonicalActiveSubscriptions() {
  return countAllActiveSubscriptions()
}

export async function listCanonicalViewerSubscriptions(userId: string) {
  return listUserSubscriptions(userId)
}

export async function listCanonicalCreatorSubscribers(input: {
  creatorId: string
  limit?: number
}) {
  return getCreatorSubscribers(input)
}
