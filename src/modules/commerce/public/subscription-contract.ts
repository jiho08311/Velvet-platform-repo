import { cancelSubscriptionUseCase } from "@/modules/commerce/application/subscription/cancel-subscription-use-case"
import { getSubscriptionUseCase } from "@/modules/commerce/application/subscription/get-subscription-use-case"
import {
  listCanonicalCreatorSubscribers,
  listCanonicalViewerSubscriptions,
  countCanonicalActiveSubscriptions,
} from "@/modules/commerce/internal/adapters/subscription-query-adapter"

import type { CommerceContext, SubscriptionState } from "./types"
import {
  listCanonicalAccessibleSubscriptionCreatorIds,
} from "@/modules/commerce/internal/adapters/subscription-query-adapter"

export async function listAccessibleSubscriptionCreatorIds(input: {
  viewerUserId: string
}) {
  return listCanonicalAccessibleSubscriptionCreatorIds(input.viewerUserId)
}


export async function countActiveSubscriptions() {
  return countCanonicalActiveSubscriptions()
}

export async function getSubscription(
  input: GetSubscriptionInput
): Promise<GetSubscriptionResult> {
  return getSubscriptionUseCase(input)
}

export async function cancelSubscription(
  input: CancelSubscriptionInput
): Promise<CancelSubscriptionResult> {
  return cancelSubscriptionUseCase(input)
}

export async function listViewerSubscriptions(input: {
  viewerUserId: string
}) {
  return listCanonicalViewerSubscriptions(input.viewerUserId)
}

export async function listCreatorSubscribers(
  input: ListCreatorSubscribersInput
) {
  return listCanonicalCreatorSubscribers(input)
}

export type CancelSubscriptionInput = {
  subscriberUserId: string
  creatorId: string
  mode: "period_end" | "immediate"
  context?: CommerceContext
}

export type CancelSubscriptionResult = {
  subscription: SubscriptionState
}

export type ExpireSubscriptionInput =
  | {
      subscriptionId: string
      reason: "period_end" | "admin"
      context?: CommerceContext
    }
  | {
      subscriberUserId: string
      creatorId: string
      reason: "payment_refund"
      context?: CommerceContext
    }

export type ExpireSubscriptionResult = {
  expiredSubscriptionIds: string[]
}

export type GetSubscriptionInput =
  | { subscriptionId: string }
  | { subscriberUserId: string; creatorId: string }

export type GetSubscriptionResult = {
  subscription: SubscriptionState | null
}

export type ListViewerSubscriptionsInput = {
  viewerUserId: string
  cursor?: string
  limit?: number
}

export type ListViewerSubscriptionsResult = {
  subscriptions: SubscriptionState[]
  nextCursor: string | null
}

export type CreatorSubscriber = {
  subscriberUserId: string
  subscription: SubscriptionState
  profile: {
    username: string | null
    displayName: string | null
    avatarUrl: string | null
  } | null
}

export type ListCreatorSubscribersInput = {
  creatorId: string
  cursor?: string
  limit?: number
}

export type ListCreatorSubscribersResult = {
  subscribers: CreatorSubscriber[]
  nextCursor: string | null
}

export type CountCreatorSubscriptionsInput = {
  creatorId: string
}

export type CountCreatorSubscriptionsResult = {
  creatorId: string
  activeCount: number
}