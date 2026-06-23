// src/modules/identity/runtime/execute-account-reactivation-runtime.ts
import {
  transitionCreatorsForAccountReactivation,
  transitionProfileToActive,
} from "../repositories/account-lifecycle-repository"


export async function executeAccountReactivation(input: {
  profileId: string
}) {
  const now = new Date().toISOString()

  const context = {
    actorType: "user" as const,
    reason: "account_reactivated",
    sourceSurface: "account.reactivation",
    sourceSymbol: "executeAccountReactivation",
    occurredAt: now,
  }

  const { error: profileError } = await transitionProfileToActive({
    profileId: input.profileId,
    context,
  })

  if (profileError) throw profileError

  const { error: creatorError } = await transitionCreatorsForAccountReactivation({
    profileId: input.profileId,
    context,
  })

  if (creatorError) throw creatorError


}