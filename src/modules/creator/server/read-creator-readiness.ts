import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"

export type CreatorReadinessBlockReason = "creator_required"

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

  if (!creator) {
    return {
      ok: false,
      reason: "creator_required",
    }
  }

  return {
    ok: true,
    creator,
  }
}
