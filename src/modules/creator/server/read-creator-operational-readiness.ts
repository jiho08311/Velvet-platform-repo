import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"

export type CreatorOperationalReadinessBlockReason =
  | "creator_required"
  | "creator_not_active"

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

  if (!creator) {
    return {
      ok: false,
      reason: "creator_required",
    }
  }

  if (creator.status !== "active") {
    return {
      ok: false,
      reason: "creator_not_active",
      creator,
    }
  }

  return {
    ok: true,
    creator,
  }
}
