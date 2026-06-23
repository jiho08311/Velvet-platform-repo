import type {
  CanonicalPostAggregate,
  CanonicalPostBlock,
  CanonicalPostVisibility,
} from "./content-authority-contract"

export type ContentProjectionSurface =
  | "post_detail"
  | "creator_page"
  | "creator_post_list"
  | "home_feed"
  | "discovery"

export type CanonicalPostPublicState =
  | "hidden"
  | "upcoming"
  | "published"

export type CanonicalPostAccessDecision = {
  canView: boolean
  isLocked: boolean
  lockReason: "subscription_required" | "purchase_required" | null
  hasPurchased: boolean
  isSubscribed: boolean
}

export type CanonicalPostRenderMediaItem = {
  id: string
  mediaId: string
  url: string | null
  type: string | null
  sortOrder: number
}

export type CanonicalPostRenderInput = {
  blockText: string
  lockedPreviewText: string
  primaryLockedPreviewMedia: CanonicalPostRenderMediaItem | null
  blockMedia: CanonicalPostRenderMediaItem[]
}

export type CanonicalPostProjection = {
  postId: string
  creatorId: string
  surface: ContentProjectionSurface
  publicState: CanonicalPostPublicState
  visibility: CanonicalPostVisibility
  access: CanonicalPostAccessDecision
  renderInput: CanonicalPostRenderInput
  selectedBlocks: CanonicalPostBlock[]
  selectedMedia: CanonicalPostRenderMediaItem[]
}

export type CanonicalFeedItem = {
  postId: string
  creatorId: string
  aggregate: CanonicalPostAggregate
  projection: CanonicalPostProjection
  feedVisibilityState: string
  isFeedVisible: boolean
  authorityMode: string
  runtimeAuthoritative: boolean
  servingAuthoritative: boolean
  rollbackSafe: boolean
  observedAt: string
}