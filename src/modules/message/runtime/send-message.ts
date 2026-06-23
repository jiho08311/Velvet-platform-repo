import {
  runSendMessageRuntime,
  type SendMessageRuntimeInput,
} from "@/modules/message/runtime/send-message-runtime"

export async function sendMessage(input: SendMessageRuntimeInput) {
  const output = await runSendMessageRuntime(input)
  return output.message
}
