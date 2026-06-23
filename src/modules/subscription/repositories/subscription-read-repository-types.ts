export type SubscriptionStatus = "incomplete" | "active" | "canceled" | "expired"
export type SubscriptionProvider = "toss" | "mock"

export type SubscriptionReadModelRow = {
  id: string
  user_id: string
  creator_id: string
  status: SubscriptionStatus
  current_period_start?: string | null
  current_period_end?: string | null
  canceled_at?: string | null
  cancel_at_period_end?: boolean | null
  created_at: string
  updated_at: string
}

export type SubscriptionIdentityRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

export type SubscriptionRow = SubscriptionReadModelRow & {
  provider: SubscriptionProvider
  provider_subscription_id: string | null
  cancel_at_period_end: boolean
}

export type FindLatestByUserAndCreatorInput = {
  userId: string
  creatorId: string
}

export type FindOwnedSubscriptionForUnsubscribeInput = {
  subscriptionId: string
  userId: string
}

export type SubscriptionCountResult = {
  count: number | null
  error: unknown
}

export type SubscriptionCreatorIdRow = {
  creator_id: string
}

export type SubscriptionOwnershipRow = {
  id: string
  user_id: string
  creator_id: string
}

export type SubscriptionWithCreatorRow = SubscriptionReadModelRow & {
  creator: SubscriptionIdentityRow | SubscriptionIdentityRow[] | null
}

export type CreatorSubscriberRow = {
  id: string
  user_id: string
  created_at: string
  status: SubscriptionStatus
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  canceled_at: string | null
  profiles: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  } | null
}

export type ListCreatorSubscriberRowsInput = {
  creatorId: string
  limit: number
  cursor?: string | null
}

export type CreatorDashboardSubscriptionStateRow = {
  status: SubscriptionStatus
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  canceled_at: string | null
}

export type CreatorSubscriptionWithProfileRow = {
  id: string
  status: SubscriptionStatus
  created_at: string
  user_id: string
  profiles:
    | {
        id: string
        username: string | null
        display_name: string | null
        avatar_url: string | null
      }
    | {
        id: string
        username: string | null
        display_name: string | null
        avatar_url: string | null
      }[]
    | null
}
