import {
  readCanonicalProfileStatus,
  resolveActiveIdentityState,
  resolveOnboardingReadiness,
} from "../repositories/identity-read-model-repository"

export async function readLegacyCompatibleProfileState(userId: string) {
  const { data: canonical } = await readCanonicalProfileStatus(userId)

  return {
    canonical,
    legacy: null,
    activeState: resolveActiveIdentityState({ canonical }),
    onboardingState: resolveOnboardingReadiness({ canonical }),
    username: canonical?.username ?? null,
    isDeactivated: canonical?.profile_lifecycle_state === "deactivated",
    isDeletePending: canonical?.profile_lifecycle_state === "delete_pending",
    deletedAt: null,
  }
}