import {
  listConversations as listConversationsRuntime,
} from "@/modules/message/runtime/list-conversations"

export const PUBLIC_CONTRACT = true

export type ListConversationsInput = Parameters<typeof listConversationsRuntime>[0]
export type ConversationListItem = Awaited<
  ReturnType<typeof listConversationsRuntime>
>[number]

export async function listConversations(
  input: ListConversationsInput
): Promise<ConversationListItem[]> {
  return listConversationsRuntime(input)
}
