import {
  readAccountLifecycleStateRuntime,
} from "@/modules/identity/runtime/read-account-lifecycle-state-runtime"

export const PUBLIC_CONTRACT = true

export type ReadAccountLifecycleStateInput = Parameters<
  typeof readAccountLifecycleStateRuntime
>[0]
export type AccountLifecycleReadModel = Awaited<
  ReturnType<typeof readAccountLifecycleStateRuntime>
>
export type AccountLifecycleState = AccountLifecycleReadModel["state"]

export async function readAccountLifecycleState(
  input: ReadAccountLifecycleStateInput
): Promise<AccountLifecycleReadModel> {
  return readAccountLifecycleStateRuntime(input)
}
