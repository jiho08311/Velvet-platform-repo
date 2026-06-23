import type { PendingEarningReleaseRow } from "@/modules/payout/repositories/earning-read-repository"

export function normalizeEarningReleaseHoldDays(holdDays: number): number {
  return Math.max(0, holdDays)
}

export function normalizeEarningReleaseLimit(limit: number): number {
  return Math.max(1, Math.min(limit, 500))
}

export function resolveEarningReleaseThreshold(holdDays: number): string {
  return new Date(Date.now() - holdDays * 24 * 60 * 60 * 1000).toISOString()
}

export function isPendingEarningReleaseEligible(
  row: PendingEarningReleaseRow,
  threshold: string
): boolean {
  if (row.available_at) {
    return true
  }

  return row.created_at <= threshold
}
