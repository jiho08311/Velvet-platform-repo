import {
  listMessages as listMessagesRuntime,
} from "@/modules/message/runtime/list-messages"

export const PUBLIC_CONTRACT = true

export type ListMessagesInput = Parameters<typeof listMessagesRuntime>[0]
export type MessageListItem = Awaited<ReturnType<typeof listMessagesRuntime>>[number]

export async function listMessages(
  input: ListMessagesInput
): Promise<MessageListItem[]> {
  return listMessagesRuntime(input)
}
