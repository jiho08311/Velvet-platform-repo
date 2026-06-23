import {
  transitionCreatorsForAccountDeletion,
  transitionProfileToDeletePending,
} from "../repositories/account-lifecycle-repository"

export async function executeAccountDeletionSchedule(input: {
  profileId: string
}) {
  const now = new Date().toISOString()

  const context = {
    actorType: "user" as const,
    reason: "account_delete_pending",
    sourceSurface: "account.settings",
    sourceSymbol: "executeAccountDeletionSchedule",
    occurredAt: now,
  }

  const { error: profileError } = await transitionProfileToDeletePending({
    profileId: input.profileId,
    context,
  })

  if (profileError) throw profileError

  const { error: creatorError } = await transitionCreatorsForAccountDeletion({
    profileId: input.profileId,
    context,
  })

  if (creatorError) throw creatorError

  return { ok: true as const }
}