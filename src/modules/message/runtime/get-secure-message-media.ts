import { toSecureMessageMediaResponse } from "@/modules/message/contracts/secure-message-media-contract"
import { resolveSecureMessageMediaRuntime } from "@/modules/message/runtime/resolve-secure-message-media-runtime"

export async function getSecureMessageMedia({
  messageId,
  userId,
}: {
  messageId: string
  userId: string
}) {
  const contract = await resolveSecureMessageMediaRuntime({
    messageId,
    userId,
  })

  return toSecureMessageMediaResponse(contract)
}