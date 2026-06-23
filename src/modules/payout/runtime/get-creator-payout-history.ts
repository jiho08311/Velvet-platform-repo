import { requireUser } from "@/modules/auth/public/require-user"
import {
  buildPayoutExecutionReadModel,
  type PayoutExecutionReadModel,
} from "@/modules/payout/mappers/build-payout-execution-read-model"
import { listRecentPayoutRowsByCreatorId } from "@/modules/payout/repositories/payout-read-repository"
import { readCreatorIdentityByUserId } from "@/modules/identity/public/creator-identity-read-model"

export type CreatorPayoutHistoryItem = PayoutExecutionReadModel

export async function getCreatorPayoutHistory(): Promise<
  CreatorPayoutHistoryItem[]
> {
  const user = await requireUser()
  const creator = await readCreatorIdentityByUserId(user.id)

  if (!creator) {
    throw new Error("Creator not found")
  }

  const rows = await listRecentPayoutRowsByCreatorId(creator.id, 20)

  return rows.map(buildPayoutExecutionReadModel)
}