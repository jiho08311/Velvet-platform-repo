import {
  readOnboardingReadiness as readOnboardingReadinessRuntime,
} from "@/modules/auth/runtime/read-onboarding-readiness"

export const PUBLIC_CONTRACT = true

export type OnboardingReadinessInput = {
  userId: string
}

export type OnboardingReadinessResult =
  Awaited<ReturnType<typeof readOnboardingReadinessRuntime>>

export async function readOnboardingReadiness(
  input: OnboardingReadinessInput
): Promise<OnboardingReadinessResult> {
  return readOnboardingReadinessRuntime(input)
}
