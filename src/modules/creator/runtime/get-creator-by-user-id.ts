import { readCreatorRowByUserId } from "@/modules/creator/repositories/creator-read-repository"

export async function getCreatorByUserId(userId: string) {
  const resolvedUserId = userId.trim()

  if (!resolvedUserId) {
    return null
  }

  const { data, error } = await readCreatorRowByUserId(resolvedUserId)

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    username: data.username ?? "",
    status: data.status,
    subscriptionPrice: data.subscription_price ?? 0,
    subscriptionCurrency: data.subscription_currency ?? "KRW",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}