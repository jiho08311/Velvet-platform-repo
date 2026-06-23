import {
  findMessageConfirmationTargetById,
  type MessageConfirmationTargetRow,
} from "@/modules/message/repositories/message-read-repository"

export type MessageConfirmationTarget = MessageConfirmationTargetRow

export async function getMessageConfirmationTarget(
  messageId: string
): Promise<MessageConfirmationTarget | null> {
  return findMessageConfirmationTargetById(messageId)
}
