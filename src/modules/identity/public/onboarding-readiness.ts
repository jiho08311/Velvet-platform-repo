import {
  readActiveIdentityState as readActiveIdentityStateRuntime,
} from "@/modules/identity/runtime/read-active-identity-state-runtime"
import {
  readOnboardingReadinessRuntime,
} from "@/modules/identity/runtime/read-onboarding-readiness-runtime"

export const PUBLIC_CONTRACT = true

export type ReadActiveIdentityStateInput = Parameters<
  typeof readActiveIdentityStateRuntime
>[0]
export type ActiveIdentityState = Awaited<
  ReturnType<typeof readActiveIdentityStateRuntime>
>
export type ActiveIdentityBlockReason = Extract<
  ActiveIdentityState,
  { ok: false }
>["reason"]

export type ReadOnboardingReadinessInput = Parameters<
  typeof readOnboardingReadinessRuntime
>[0]
export type OnboardingReadiness = Awaited<
  ReturnType<typeof readOnboardingReadinessRuntime>
>
export type OnboardingReadinessBlockReason = Extract<
  OnboardingReadiness,
  { ok: false }
>["reason"]

export async function readActiveIdentityState(
  input: ReadActiveIdentityStateInput
): Promise<ActiveIdentityState> {
  return readActiveIdentityStateRuntime(input)
}

export async function readOnboardingReadiness(
  input: ReadOnboardingReadinessInput
): Promise<OnboardingReadiness> {
  return readOnboardingReadinessRuntime(input)
}

export { readOnboardingReadinessRuntime }
