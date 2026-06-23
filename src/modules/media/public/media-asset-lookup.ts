// src/modules/media/public/media-asset-lookup.ts
import {
  findMediaAssetsByLegacyMediaIds as findMediaAssetsByLegacyIds,
} from "@/modules/media/repositories/media-asset-repository"

export const PUBLIC_CONTRACT = true

export type MediaAssetLookupRow = Awaited<
  ReturnType<typeof findMediaAssetsByLegacyIds>
>[number]

export async function findMediaAssetsByLegacyMediaIds(
  legacyMediaIds: string[]
): Promise<MediaAssetLookupRow[]> {
  return findMediaAssetsByLegacyIds(legacyMediaIds)
}
