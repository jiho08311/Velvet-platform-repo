import {
  executeAccountDeactivation as executeAccountDeactivationRuntime,
} from "@/modules/identity/runtime/execute-account-deactivation-runtime"

export const PUBLIC_CONTRACT = true

export type ExecuteAccountDeactivationInput = Parameters<
  typeof executeAccountDeactivationRuntime
>[0]

export async function executeAccountDeactivation(
  input: ExecuteAccountDeactivationInput
): Promise<void> {
  return executeAccountDeactivationRuntime(input)
}
