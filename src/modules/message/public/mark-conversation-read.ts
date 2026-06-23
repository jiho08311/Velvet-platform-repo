import {
  markConversationRead as markConversationReadRuntime,
} from "@/modules/message/runtime/mark-conversation-read"

export const PUBLIC_CONTRACT = true

export type MarkConversationReadInput = Parameters<typeof markConversationReadRuntime>[0]

export async function markConversationRead(
  input: MarkConversationReadInput
): Promise<void> {
  return markConversationReadRuntime(input)
}
