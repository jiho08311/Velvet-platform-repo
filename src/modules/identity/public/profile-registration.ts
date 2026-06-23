import {
  executeProfileRegistration as executeProfileRegistrationRuntime,
} from "@/modules/identity/runtime/execute-profile-registration-runtime"

export const PUBLIC_CONTRACT = true

export type ExecuteProfileRegistrationInput = Parameters<
  typeof executeProfileRegistrationRuntime
>[0]
export type ExecuteProfileRegistrationResult = Awaited<
  ReturnType<typeof executeProfileRegistrationRuntime>
>

export async function executeProfileRegistration(
  input: ExecuteProfileRegistrationInput
): Promise<ExecuteProfileRegistrationResult> {
  return executeProfileRegistrationRuntime(input)
}
