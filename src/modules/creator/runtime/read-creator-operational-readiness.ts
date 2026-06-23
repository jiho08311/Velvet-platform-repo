// src/modules/creator/runtime/read-creator-operational-readiness.ts

import { getCreatorByUserId } from "@/modules/creator/runtime/get-creator-by-user-id"
import {
  buildCreatorOperationalReadinessResult,
  type CreatorOperationalReadinessBlockReason,
} from "@/modules/creator/services/creator-readiness-service"

type Creator = NonNullable<Awaited<ReturnType<typeof getCreatorByUserId>>>

type ReadCreatorOperationalReadinessParams = {
  userId: string
}

type ReadCreatorOperationalReadinessResult =
  | {
      ok: true
      creator: Creator
    }
  | {
      ok: false
      reason: "creator_required"
    }
  | {
      ok: false
      reason: "creator_not_active"
      creator: Creator
    }

export async function readCreatorOperationalReadiness({
  userId,
}: ReadCreatorOperationalReadinessParams): Promise<ReadCreatorOperationalReadinessResult> {
  const creator = await getCreatorByUserId(userId)

  return buildCreatorOperationalReadinessResult(creator)
}