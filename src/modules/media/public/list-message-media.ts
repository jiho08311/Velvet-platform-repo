// src/modules/media/public/list-message-media.ts

import {
  listMessageMediaRuntime,
} from "@/modules/media/runtime/list-message-media-runtime"

export const PUBLIC_CONTRACT = true

export type ListMessageMediaInput = {
  messageIds: string[]
  requireReadyAsset?: boolean
}

export type MessageMediaItemContract = Awaited<
  ReturnType<typeof listMessageMediaRuntime>
>[number]

export async function listMessageMedia(
  input: ListMessageMediaInput
): Promise<MessageMediaItemContract[]> {
  return listMessageMediaRuntime(input)
}
