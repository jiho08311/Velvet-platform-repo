import { executeEarningCreation } from "@/modules/payout/runtime/execute-earning-creation"
import type { EarningCreationResult } from "@/modules/payout/contracts/earning-mutation-contract"

type CreateEarningInput = {
  paymentId: string
}

export async function createEarning({
  paymentId,
}: CreateEarningInput): Promise<EarningCreationResult["earning"]> {
  return executeEarningCreation({ paymentId })
}
