import {
  readCanonicalProfileStatus,
  resolveOnboardingReadiness,
} from "../repositories/identity-read-model-repository"

export async function readOnboardingReadinessRuntime({
  userId,
}: {
  userId: string
}) {
  const { data: canonical } = await readCanonicalProfileStatus(userId)

  return resolveOnboardingReadiness({ canonical })
}