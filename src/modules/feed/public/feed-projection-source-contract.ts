export const FEED_PROJECTION_OFFICIAL_SOURCES = {
  items: "canonical_feed_items",
  events: "canonical_feed_projection_events",
  visibility: "canonical_feed_visibility_projections",
} as const

export type FeedProjectionOfficialSource =
  (typeof FEED_PROJECTION_OFFICIAL_SOURCES)[keyof typeof FEED_PROJECTION_OFFICIAL_SOURCES]

export type FeedProjectionSourceRole =
  | "runtime_read_model"
  | "projection_event_audit"
  | "visibility_promotion_validation"

export type FeedProjectionSourceContract = {
  source: FeedProjectionOfficialSource
  role: FeedProjectionSourceRole
  description: string
}

export const FEED_PROJECTION_SOURCE_CONTRACTS: FeedProjectionSourceContract[] = [
  {
    source: FEED_PROJECTION_OFFICIAL_SOURCES.items,
    role: "runtime_read_model",
    description: "Official feed item read model source for projection-first feed runtimes.",
  },
  {
    source: FEED_PROJECTION_OFFICIAL_SOURCES.events,
    role: "projection_event_audit",
    description: "Official audit/event source for feed projection mutation and rebuild events.",
  },
  {
    source: FEED_PROJECTION_OFFICIAL_SOURCES.visibility,
    role: "visibility_promotion_validation",
    description: "Official source for projection surface visibility validation, promotion, and rollback safety.",
  },
]
