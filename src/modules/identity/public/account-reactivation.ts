import {
  executeAccountReactivation as executeAccountReactivationRuntime,
} from "@/modules/identity/runtime/execute-account-reactivation-runtime"

export const PUBLIC_CONTRACT = true

export type ExecuteAccountReactivationInput = Parameters<
  typeof executeAccountReactivationRuntime
>[0]

export async function executeAccountReactivation(
  input: ExecuteAccountReactivationInput
): Promise<void> {
  return executeAccountReactivationRuntime(input)
}
