// src/modules/creator/runtime/read-creator-readiness.ts

import { getCreatorByUserId } from "@/modules/creator/runtime/get-creator-by-user-id"
import {
  buildCreatorReadinessResult,
  type CreatorReadinessBlockReason,
} from "@/modules/creator/services/creator-readiness-service"

type Creator = NonNullable<Awaited<ReturnType<typeof getCreatorByUserId>>>

type ReadCreatorReadinessParams = {
  userId: string
}

type ReadCreatorReadinessResult =
  | {
      ok: true
      creator: Creator
    }
  | {
      ok: false
      reason: CreatorReadinessBlockReason
    }

export async function readCreatorReadiness({
  userId,
}: ReadCreatorReadinessParams): Promise<ReadCreatorReadinessResult> {
  const creator = await getCreatorByUserId(userId)

  return buildCreatorReadinessResult(creator)
}