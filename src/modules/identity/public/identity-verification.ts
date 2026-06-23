import {
  executeIdentityVerification as executeIdentityVerificationRuntime,
} from "@/modules/identity/runtime/execute-identity-verification-runtime"

export const PUBLIC_CONTRACT = true

export type ExecuteIdentityVerificationInput = Parameters<
  typeof executeIdentityVerificationRuntime
>[0]

export async function executeIdentityVerification(
  input: ExecuteIdentityVerificationInput
): Promise<void> {
  return executeIdentityVerificationRuntime(input)
}
