import {
  executeAccountDeletionSchedule as executeAccountDeletionScheduleRuntime,
} from "@/modules/identity/runtime/execute-account-deletion-schedule-runtime"

export const PUBLIC_CONTRACT = true

export type ExecuteAccountDeletionScheduleInput = Parameters<
  typeof executeAccountDeletionScheduleRuntime
>[0]
export type ExecuteAccountDeletionScheduleResult = Awaited<
  ReturnType<typeof executeAccountDeletionScheduleRuntime>
>

export async function executeAccountDeletionSchedule(
  input: ExecuteAccountDeletionScheduleInput
): Promise<ExecuteAccountDeletionScheduleResult> {
  return executeAccountDeletionScheduleRuntime(input)
}
