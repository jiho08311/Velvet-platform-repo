import { findMessageAccessRequirementByMessageId } from "@/modules/message/repositories/message-access-requirement-repository"

export const PUBLIC_CONTRACT = true

export type GetMessageAccessRequirementInput = {
  messageId: string
}

export type MessageAccessRequirement = Awaited<
  ReturnType<typeof findMessageAccessRequirementByMessageId>
>

export async function getMessageAccessRequirement(
  input: GetMessageAccessRequirementInput
): Promise<MessageAccessRequirement> {
  return findMessageAccessRequirementByMessageId(input.messageId)
}
