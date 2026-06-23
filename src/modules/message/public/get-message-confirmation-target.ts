import {
  getMessageConfirmationTarget as getMessageConfirmationTargetRuntime,
} from "@/modules/message/runtime/get-message-confirmation-target"

export const PUBLIC_CONTRACT = true

export type GetMessageConfirmationTargetInput = Parameters<
  typeof getMessageConfirmationTargetRuntime
>[0]
export type MessageConfirmationTarget = NonNullable<
  Awaited<ReturnType<typeof getMessageConfirmationTargetRuntime>>
>

export async function getMessageConfirmationTarget(
  input: GetMessageConfirmationTargetInput
): Promise<MessageConfirmationTarget | null> {
  return getMessageConfirmationTargetRuntime(input)
}
