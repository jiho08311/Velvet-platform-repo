import {
  executeProfileDisplayUpdate as executeProfileDisplayUpdateRuntime,
} from "@/modules/identity/runtime/execute-profile-display-update-runtime"

export const PUBLIC_CONTRACT = true

export type ExecuteProfileDisplayUpdateInput = Parameters<
  typeof executeProfileDisplayUpdateRuntime
>[0]
export type ExecuteProfileDisplayUpdateResult = Awaited<
  ReturnType<typeof executeProfileDisplayUpdateRuntime>
>

export async function executeProfileDisplayUpdate(
  input: ExecuteProfileDisplayUpdateInput
): Promise<ExecuteProfileDisplayUpdateResult> {
  return executeProfileDisplayUpdateRuntime(input)
}
