import {
  sendMessage as sendMessageRuntime,
} from "@/modules/message/runtime/send-message"

export const PUBLIC_CONTRACT = true

export type SendMessageInput = Parameters<typeof sendMessageRuntime>[0]
export type SendMessageResult = Awaited<ReturnType<typeof sendMessageRuntime>>

export async function sendMessage(
  input: SendMessageInput
): Promise<SendMessageResult> {
  return sendMessageRuntime(input)
}
