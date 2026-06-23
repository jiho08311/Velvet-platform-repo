import {
  getConversationById as getConversationByIdRuntime,
} from "@/modules/message/runtime/get-conversation-by-id"

export const PUBLIC_CONTRACT = true

export type GetConversationByIdInput = Parameters<typeof getConversationByIdRuntime>[0]
export type GetConversationByIdResult = Awaited<
  ReturnType<typeof getConversationByIdRuntime>
>

export async function getConversationById(
  input: GetConversationByIdInput
): Promise<GetConversationByIdResult> {
  return getConversationByIdRuntime(input)
}
