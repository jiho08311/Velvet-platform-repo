export const FEED_EMPTY_STATE = {
  defaultTitle: "No feed yet",
  defaultDescription: "Subscribe to creators to see posts in your feed.",
  actionLabel: "Explore creators",
  actionHref: "/search",
} as const

export const FEED_LIST_EMPTY_STATE = {
  defaultTitle: "No posts yet",
  defaultDescription: "Posts from creators you follow will appear here.",
} as const

export const FEED_LOADING_STATE = {
  skeletonCount: 2,
  infiniteTailSkeletonCount: 2,
} as const

export const FEED_UPCOMING_STATE = {
  badgeLabel: "Upcoming",
  badgeTone: "info",
  defaultTitle: "Upcoming post",
  actionLabel: "See upcoming posts →",
  actionHref: "/drops",
} as const

export const FEED_COMPOSER_ACTIONS = {
  attachLabel: "Add media",
  clearLabel: "Clear",
  visibilityPublicLabel: "Public",
  visibilitySubscribersLabel: "Subscribers",
} as const