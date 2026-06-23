import { transitionProfileToDeleted } from "@/modules/identity/repositories/account-lifecycle-repository"

export const PUBLIC_CONTRACT = true

export type MarkExpiredDeletePendingAccountAsDeletedInput = {
  profileId: string
  deletedAt: string
}

export type MarkExpiredDeletePendingAccountAsDeletedResult = {
  ok: true
}

export async function markExpiredDeletePendingAccountAsDeleted({
  profileId,
  deletedAt,
}: MarkExpiredDeletePendingAccountAsDeletedInput): Promise<MarkExpiredDeletePendingAccountAsDeletedResult> {
  await transitionProfileToDeleted({ profileId, deletedAt })

  return { ok: true as const }
}
