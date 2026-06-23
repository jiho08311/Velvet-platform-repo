import { listAccessibleSubscriptionCreatorIds } from "@/modules/commerce/public/subscription-contract"
import { listRecommendedCreatorCards } from "@/modules/search/repositories/creator-public-card-search-repository"

import type { DiscoveryCreatorLinkItem } from "../discovery-contract"

type GetRecommendedCreatorsInput = {
  viewerUserId?: string
  limit?: number
}

export async function getRecommendedCreators({
  viewerUserId,
  limit = 3,
}: GetRecommendedCreatorsInput): Promise<DiscoveryCreatorLinkItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, 12))

  const safeViewerUserId = viewerUserId?.trim() ?? ""

  if (!safeViewerUserId) {
    return []
  }

  const subscribedCreatorIds = await listAccessibleSubscriptionCreatorIds({
    viewerUserId: safeViewerUserId,
  })

  const rows = await listRecommendedCreatorCards({
    excludeCreatorIds: subscribedCreatorIds,
    excludeUserId: safeViewerUserId,
    limit: safeLimit * 4,
  })

return rows.slice(0, safeLimit).map((row) => ({
  id: row.creator_id,
  username: row.username ?? row.creator_id,
  displayName: row.display_name ?? "",
  avatarUrl: row.avatar_url ?? "",
}))
}
