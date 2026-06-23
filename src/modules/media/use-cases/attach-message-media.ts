import {
  attachMessageMediaRowsToMessage as attachMessageMediaRowsToMessageUseCase,
} from "@/modules/media/use-cases/get-message-media"

export async function attachMessageMediaRowsToMessage(input: {
  mediaIds: string[]
  messageId: string
}) {
  return attachMessageMediaRowsToMessageUseCase(input)
}
