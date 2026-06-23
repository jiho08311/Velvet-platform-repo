import { listSubscriptionsWithProfilesByCreatorId } from "@/modules/subscription/repositories/subscription-read-repository"

export async function listSubscriptions(creatorId: string) {
  let data

  try {
    data = await listSubscriptionsWithProfilesByCreatorId(creatorId)
  } catch {
    throw new Error("Failed to load subscriptions")
  }

  return data.map((subscription) => {
    const user = Array.isArray(subscription.profiles)
      ? subscription.profiles[0]
      : subscription.profiles

    return {
      id: subscription.id,
      status: subscription.status,
      startedAt: subscription.created_at,
      userId: user?.id ?? "",
      username: user?.username ?? "",
      displayName: user?.display_name ?? "",
      avatarUrl: user?.avatar_url ?? null,
    }
  })
}
