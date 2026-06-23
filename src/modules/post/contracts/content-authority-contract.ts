export type ContentAuthoritySource =
  | "runtime"
  | "legacy_bridge"
  | "projection"
  | "admin"
  | "job"
  | "moderation"

export type ContentAuthorityContext = {
  actorId?: string | null
  source: ContentAuthoritySource
  sourceSurface: string
  sourceSymbol: string
  occurredAt: string
}

export type CanonicalPostLifecycleStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "archived"

export type CanonicalPostVisibility =
  | "public"
  | "subscribers"
  | "paid"

export type CanonicalPostVisibilityStatus =
  | "draft"
  | "processing"
  | "published"
  | "rejected"

export type CanonicalPostModerationStatus =
  | "pending"
  | "approved"
  | "needs_review"
  | "rejected"

export type CanonicalPostBlockType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "file"

export type CanonicalPostBlock = {
  id?: string
  postId: string
  type: CanonicalPostBlockType
  content: string | null
  mediaId: string | null
  sortOrder: number
}

export type CanonicalPostAggregate = {
  id: string
  creatorId: string
  title: string | null
  content: string | null
  visibility: CanonicalPostVisibility
  price: number
  status: CanonicalPostLifecycleStatus
  visibilityStatus: CanonicalPostVisibilityStatus
  moderationStatus: CanonicalPostModerationStatus
  moderationCompletedAt?: string | null
  rejectionReason?: string | null
  publishedAt: string | null
  deletedAt: string | null
  blocks: CanonicalPostBlock[]
}

export type CanonicalPostLifecycleTransition = {
  from: CanonicalPostLifecycleStatus | null
  to: CanonicalPostLifecycleStatus
  publishedAt?: string | null
  deletedAt?: string | null
}

export type CanonicalPostVisibilityTransition = {
  from: CanonicalPostVisibilityStatus | null
  to: CanonicalPostVisibilityStatus
}

export type CanonicalPostModerationDecision = {
  outcome: CanonicalPostModerationStatus
  rejectionReason?: string | null
}