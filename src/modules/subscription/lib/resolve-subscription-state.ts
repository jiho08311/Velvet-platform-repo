import type { SubscriptionStatus } from "@/modules/subscription/server/subscription-status"

type ResolveSubscriptionStateInput = {
  status: SubscriptionStatus
  currentPeriodEndAt?: string | null
  cancelAtPeriodEnd?: boolean | null
  canceledAt?: string | null
  now?: Date
}

export type SubscriptionAccessState = "active" | "inactive"

export type SubscriptionDisplayState =
  | "active"
  | "ending"
  | "expired"
  | "inactive"

export type ResolvedSubscriptionState = {
  accessState: SubscriptionAccessState
  displayState: SubscriptionDisplayState
  hasAccess: boolean
  isExpired: boolean
  isCancelScheduled: boolean
  endsAt: string | null
}

function isFutureDate(value?: string | null, now: Date = new Date()): boolean {
  if (!value) {
    return false
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date.getTime() > now.getTime()
}

function isPastOrNow(value?: string | null, now: Date = new Date()): boolean {
  if (!value) {
    return false
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date.getTime() <= now.getTime()
}

export function resolveSubscriptionState(
  input: ResolveSubscriptionStateInput
): ResolvedSubscriptionState {
  const now = input.now ?? new Date()
  const status = input.status
  const endsAt = input.currentPeriodEndAt ?? null
  const cancelAtPeriodEnd = Boolean(input.cancelAtPeriodEnd)

  const hasFuturePeriod = isFutureDate(endsAt, now)
  const isExpiredByDate = isPastOrNow(endsAt, now)

  if (status === "active") {
    if (hasFuturePeriod) {
      if (cancelAtPeriodEnd) {
        return {
          accessState: "active",
          displayState: "ending",
          hasAccess: true,
          isExpired: false,
          isCancelScheduled: true,
          endsAt,
        }
      }

      return {
        accessState: "active",
        displayState: "active",
        hasAccess: true,
        isExpired: false,
        isCancelScheduled: false,
        endsAt,
      }
    }

    return {
      accessState: "inactive",
      displayState: "expired",
      hasAccess: false,
      isExpired: true,
      isCancelScheduled: false,
      endsAt,
    }
  }

  if (status === "expired") {
    return {
      accessState: "inactive",
      displayState: "expired",
      hasAccess: false,
      isExpired: true,
      isCancelScheduled: false,
      endsAt,
    }
  }

  if (status === "canceled") {
    if (hasFuturePeriod) {
      return {
        accessState: "active",
        displayState: "ending",
        hasAccess: true,
        isExpired: false,
        isCancelScheduled: true,
        endsAt,
      }
    }

    if (isExpiredByDate || input.canceledAt) {
      return {
        accessState: "inactive",
        displayState: "expired",
        hasAccess: false,
        isExpired: true,
        isCancelScheduled: false,
        endsAt,
      }
    }

    return {
      accessState: "inactive",
      displayState: "inactive",
      hasAccess: false,
      isExpired: false,
      isCancelScheduled: false,
      endsAt,
    }
  }

  return {
    accessState: "inactive",
    displayState: "inactive",
    hasAccess: false,
    isExpired: false,
    isCancelScheduled: false,
    endsAt,
  }
}