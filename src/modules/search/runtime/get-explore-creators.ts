import { listPublicCreatorCards } from "@/modules/search/repositories/creator-public-card-search-repository"

import type { DiscoveryCreatorLinkItem } from "../discovery-contract"

export async function getExploreCreators(
  limit = 20
): Promise<DiscoveryCreatorLinkItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, 50))

  const rows = await listPublicCreatorCards({
    limit: safeLimit * 3,
  })

return rows.slice(0, safeLimit).map((row) => ({
  id: row.creator_id,
  username: row.username ?? row.creator_id,
  displayName: row.display_name ?? "",
  avatarUrl: row.avatar_url ?? "",
}))
}