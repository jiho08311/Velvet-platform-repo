import { listCreatorDashboardPayments } from "@/modules/payment/public/list-creator-dashboard-payments"
import { listCreatorAnalyticsPayments } from "@/modules/payment/public/list-creator-analytics-payments"
import {
  countCreatorActiveSubscriptions,
  countCreatorSubscriptions,
} from "@/modules/subscription/public/count-subscriptions-by-creator"
import { listCreatorDashboardSubscriptionStates } from "@/modules/subscription/public/list-creator-dashboard-subscription-states"
import { resolveSubscriptionState } from "@/modules/subscription/public/subscription-state"

export async function listCanonicalCreatorAnalyticsPayments(input: {
  creatorId: string
  periodStart: string
}) {
  return listCreatorAnalyticsPayments(input)
}

export async function countCanonicalCreatorSubscriptions(creatorId: string) {
  return countCreatorSubscriptions(creatorId)
}

export async function countCanonicalCreatorActiveSubscriptions(
  creatorId: string
) {
  return countCreatorActiveSubscriptions(creatorId)
}

export async function listCanonicalCreatorDashboardPayments(input: {
  creatorId: string
  monthStart: string
}) {
  return listCreatorDashboardPayments(input)
}

export async function listCanonicalCreatorDashboardSubscriptionStates(
  creatorId: string
) {
  return listCreatorDashboardSubscriptionStates(creatorId)
}

export function resolveCanonicalSubscriptionAccess(input: {
  status: "incomplete" | "active" | "canceled" | "expired"
  currentPeriodEndAt: string | null
  cancelAtPeriodEnd: boolean | null
  canceledAt: string | null
}) {
  return resolveSubscriptionState(input)
}
