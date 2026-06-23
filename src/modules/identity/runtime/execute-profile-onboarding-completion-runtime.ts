// src/modules/identity/runtime/execute-profile-onboarding-completion-runtime.ts
import {
  claimProfileUsername,
  readDuplicateUsername,
} from "../repositories/profile-authority-repository"

export async function executeProfileOnboardingCompletion(input: {
  profileId: string
  username: string
}) {
  const username = input.username.trim().toLowerCase()

  if (!username) throw new Error("USERNAME_REQUIRED")

  const { data: duplicate, error: duplicateError } = await readDuplicateUsername({
    profileId: input.profileId,
    username,
  })

  if (duplicateError) throw duplicateError
  if (duplicate?.profile_id) throw new Error("USERNAME_TAKEN")

  const { error } = await claimProfileUsername({
    profileId: input.profileId,
    username,
    context: {
      actorType: "user",
      reason: "profile_onboarding_completed",
      sourceSurface: "profile.onboarding",
      sourceSymbol: "executeProfileOnboardingCompletion",
      occurredAt: new Date().toISOString(),
    },
  })

  if (error) throw error

  return { ok: true as const }
}