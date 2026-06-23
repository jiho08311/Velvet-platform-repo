"use server"
// PUBLIC_CONTRACT

import {
  attachMessageMediaRowsToMessage as attachMessageMediaRowsToMessageUseCase,
} from "@/modules/media/use-cases/attach-message-media"

export async function attachMessageMediaRowsToMessage(input: {
  mediaIds: string[]
  messageId: string
}) {
  return attachMessageMediaRowsToMessageUseCase(input)
}
