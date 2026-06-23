// src/modules/identity/runtime/execute-account-deactivation-runtime.ts
import {
  transitionProfileToDeactivated,
  transitionCreatorsForAccountDeletion,
} from "../repositories/account-lifecycle-repository"

export async function executeAccountDeactivation(input: {
  profileId: string
}) {
  const now = new Date().toISOString()

  const context = {
    actorType: "user" as const,
    reason: "account_deactivated",
    sourceSurface: "account.settings",
    sourceSymbol: "executeAccountDeactivation",
    occurredAt: now,
  }

  const { error: profileError } = await transitionProfileToDeactivated({
    profileId: input.profileId,
    context,
  })
  if (profileError) throw profileError

  const { error: creatorError } = await transitionCreatorsForAccountDeletion({
    profileId: input.profileId,
    context,
  })

  if (creatorError) throw creatorError

}
