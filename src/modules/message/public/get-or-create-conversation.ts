import {
  getOrCreateConversation as getOrCreateConversationRuntime,
} from "@/modules/message/runtime/get-or-create-conversation"

export const PUBLIC_CONTRACT = true

export type GetOrCreateConversationInput = Parameters<
  typeof getOrCreateConversationRuntime
>[0]
export type Conversation = Awaited<ReturnType<typeof getOrCreateConversationRuntime>>

export async function getOrCreateConversation(
  input: GetOrCreateConversationInput
): Promise<Conversation> {
  return getOrCreateConversationRuntime(input)
}
