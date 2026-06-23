import type {
  CommerceContext,
  CreatorEarningsBalance,
  EarningState,
} from "./types"

import { releasePendingEarningsUseCase } from "@/modules/commerce/application/settlement/release-pending-earnings-use-case"

export async function releasePendingEarnings(
  input: ReleasePendingEarningsInput = {}
): Promise<ReleasePendingEarningsResult> {
  return releasePendingEarningsUseCase(input)
}

export type ReleasePendingEarningsInput = {
  holdDays?: number
  limit?: number
  context?: CommerceContext
}

export type ReleasePendingEarningsResult = {
  processedCount: number
  earningIds: string[]
}

export type GetCreatorEarningsBalanceInput = {
  creatorId: string
}

export type GetCreatorEarningsBalanceResult = {
  balance: CreatorEarningsBalance
}

export type ListCreatorEarningsInput = {
  creatorId: string
  status?: EarningState["status"]
  cursor?: string
  limit?: number
}

export type ListCreatorEarningsResult = {
  earnings: EarningState[]
  nextCursor: string | null
}

export type GetPlatformRevenueSummaryInput = {
  currency?: "KRW"
}

export type PlatformRevenueSummary = {
  currency: "KRW"
  gross: number
  net: number
  platformFee: number
}

export type GetPlatformRevenueSummaryResult = {
  summary: PlatformRevenueSummary
}