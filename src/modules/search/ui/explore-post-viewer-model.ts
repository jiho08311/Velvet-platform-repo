import type { DiscoveryPostLinkItem } from "../discovery-contract"
import { readViewerHasLikedFromCompatibility } from "@/shared/lib/like-interaction-result"

export type ExplorePostViewerBlock =
  | {
      kind: "text"
      id: string
      content: string
    }
  | {
      kind: "media"
      id: string
      items: Array<{
        id: string
        type: "image" | "video"
        url: string
      }>
    }

export function readDiscoveryPostViewerHasLiked(
  post: DiscoveryPostLinkItem
): boolean {
  return readViewerHasLikedFromCompatibility({
    viewerHasLiked: post.viewerHasLiked,
    isLiked: post.isLiked,
  })
}
