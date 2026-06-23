import {
  executeProfileOnboardingCompletion as executeProfileOnboardingCompletionRuntime,
} from "@/modules/identity/runtime/execute-profile-onboarding-completion-runtime"

export const PUBLIC_CONTRACT = true

export type ExecuteProfileOnboardingCompletionInput = Parameters<
  typeof executeProfileOnboardingCompletionRuntime
>[0]
export type ExecuteProfileOnboardingCompletionResult = Awaited<
  ReturnType<typeof executeProfileOnboardingCompletionRuntime>
>

export async function executeProfileOnboardingCompletion(
  input: ExecuteProfileOnboardingCompletionInput
): Promise<ExecuteProfileOnboardingCompletionResult> {
  return executeProfileOnboardingCompletionRuntime(input)
}
