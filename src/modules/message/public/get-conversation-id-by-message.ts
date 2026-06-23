import {
  getConversationIdByMessage as getConversationIdByMessageRuntime,
} from "@/modules/message/runtime/get-conversation-id-by-message"

export const PUBLIC_CONTRACT = true

export type GetConversationIdByMessageInput = Parameters<
  typeof getConversationIdByMessageRuntime
>[0]
export type GetConversationIdByMessageResult = Awaited<
  ReturnType<typeof getConversationIdByMessageRuntime>
>

export async function getConversationIdByMessage(
  input: GetConversationIdByMessageInput
): Promise<GetConversationIdByMessageResult> {
  return getConversationIdByMessageRuntime(input)
}
