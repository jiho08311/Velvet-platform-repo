import {
  processMessageOutboxRuntime,
} from "@/modules/message/runtime/process-message-outbox-runtime"

export const PUBLIC_CONTRACT = true

export type ProcessMessageOutboxInput = Parameters<
  typeof processMessageOutboxRuntime
>[0]
export type ProcessMessageOutboxResult = Awaited<
  ReturnType<typeof processMessageOutboxRuntime>
>

export async function processMessageOutbox(
  input: ProcessMessageOutboxInput
): Promise<ProcessMessageOutboxResult> {
  return processMessageOutboxRuntime(input)
}
