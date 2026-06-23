import {
  assertPassVerified as assertPassVerifiedRuntime,
  getPassVerificationRedirectPath as getPassVerificationRedirectPathRuntime,
  normalizePassVerificationNext as normalizePassVerificationNextRuntime,
} from "@/modules/auth/runtime/assert-pass-verified"

export const PUBLIC_CONTRACT = true

export type PassVerificationRedirectInput = Parameters<
  typeof getPassVerificationRedirectPathRuntime
>[0]

export type AssertPassVerifiedInput = {
  profileId: string
}

export type AssertPassVerifiedResult = Awaited<
  ReturnType<typeof assertPassVerifiedRuntime>
>

export async function assertPassVerified(
  input: AssertPassVerifiedInput
): Promise<AssertPassVerifiedResult> {
  return assertPassVerifiedRuntime(input)
}

export function getPassVerificationRedirectPath(
  input: PassVerificationRedirectInput
): string {
  return getPassVerificationRedirectPathRuntime(input)
}

export function normalizePassVerificationNext(next: string): string | null {
  return normalizePassVerificationNextRuntime(next)
}
