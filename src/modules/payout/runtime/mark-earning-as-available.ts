import { markEarningAsAvailableForRelease } from "@/modules/payout/services/earning-release-service"
import type { EarningRow } from "@/modules/payout/repositories/earning-read-repository"

type MarkEarningAsAvailableInput = {
  earningId: string
}

export async function markEarningAsAvailable({
  earningId,
}: MarkEarningAsAvailableInput): Promise<EarningRow | null> {
  return markEarningAsAvailableForRelease({ earningId })
}
