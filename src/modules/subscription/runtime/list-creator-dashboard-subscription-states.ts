import { listCreatorDashboardSubscriptionStateRows } from "@/modules/subscription/repositories/subscription-read-repository"

export async function listCreatorDashboardSubscriptionStates(creatorId: string) {
  return listCreatorDashboardSubscriptionStateRows(creatorId)
}
