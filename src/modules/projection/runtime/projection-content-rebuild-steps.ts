import { rebuildContentPublicCards } from "@/modules/content/public/rebuild-content-public-cards"
import { rebuildCreatorPublicCards } from "@/modules/creator/public/rebuild-creator-public-cards"
import { rebuildFeedProjection } from "@/modules/post/public/rebuild-feed-projection"
import { rebuildSearchDocuments } from "@/modules/search/public/rebuild-search-documents"
import type { RebuildStep } from "./projection-rebuild-step-registry"

export function createContentProjectionRebuildSteps(input: {
  dryRun: boolean
  limit: number
}): RebuildStep[] {
  const { dryRun, limit } = input

  return [
    {
      name: "canonical_feed_items",
      run: () =>
        rebuildFeedProjection({
          dryRun,
          limit,
          projectionSurface: "home_feed",
        }),
    },
    {
      name: "creator_public_cards",
      run: () => rebuildCreatorPublicCards({ dryRun, limit }),
    },
    {
      name: "content_public_cards",
      run: () =>
        rebuildContentPublicCards({
          dryRun,
          limit,
          projectionSurface: "home_feed",
        }),
    },
    {
      name: "search_documents",
      run: () => rebuildSearchDocuments({ dryRun, limit }),
    },
  ]
}
