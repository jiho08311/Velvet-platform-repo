export const SUBSCRIBER_COUNT_POLICY = {
  subscriberCount: {
    field: "subscriberCount",
    sourceTable: "subscriptions",
    filters: ["creator_id"],
    description:
      "Total subscription rows for a creator. This intentionally includes all subscription statuses.",
  },
  activeSubscriptionCount: {
    field: "activeSubscriptionCount",
    sourceTable: "subscriptions",
    filters: ["creator_id", "status = active"],
    description:
      "Active subscription rows for a creator. This only includes subscriptions with status active.",
  },
} as const

export const SUBSCRIBER_COUNT_SURFACE_POLICY = {
  publicProfileStats: "subscriberCount",
  creatorPageStats: "subscriberCount",
  creatorAnalyticsSubscribersMetric: "subscriberCount",
  creatorAnalyticsActiveSubscriptionsMetric: "activeSubscriptionCount",
  dashboardSubscribersMetric: "subscriberCount",
  dashboardSubscribersList: "accessEligibleSubscriptions",
} as const

export type SubscriberCountPolicyKey = keyof typeof SUBSCRIBER_COUNT_POLICY

export type SubscriberCountSurfacePolicyKey =
  keyof typeof SUBSCRIBER_COUNT_SURFACE_POLICY