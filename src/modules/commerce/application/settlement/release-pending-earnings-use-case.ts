import { releaseCanonicalPendingEarnings } from "@/modules/commerce/internal/adapters/settlement-adapter"
import type {
  ReleasePendingEarningsInput,
  ReleasePendingEarningsResult,
} from "@/modules/commerce/public/settlement-contract"

export async function releasePendingEarningsUseCase({
  holdDays,
  limit,
}: ReleasePendingEarningsInput = {}): Promise<ReleasePendingEarningsResult> {
  return releaseCanonicalPendingEarnings({
    holdDays,
    limit,
  })
}