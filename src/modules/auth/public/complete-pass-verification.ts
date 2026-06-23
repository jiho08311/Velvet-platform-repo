import {
  completePassVerification as completePassVerificationRuntime,
} from "@/modules/auth/runtime/complete-pass-verification"

export const PUBLIC_CONTRACT = true

export type CompletePassVerificationInput = {
  requestId: string
  profileId: string
  mock: string | null
}

export type CompletePassVerificationResult = Awaited<
  ReturnType<typeof completePassVerificationRuntime>
>

export async function completePassVerification(
  input: CompletePassVerificationInput
): Promise<CompletePassVerificationResult> {
  return completePassVerificationRuntime(input)
}
